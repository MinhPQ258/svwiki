import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

Object.assign(global, { WebSocket });

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Vui lòng cung cấp NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong file .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const API_BASE = 'https://stardewvalleyvietnam.fandom.com/vi/api.php';

// Các từ khóa thuộc danh mục không muốn crawl (bằng tiếng Việt / Anh trên wiki)
const EXCLUDED_CATEGORIES = ['furniture', 'đồ nội thất', 'decor', 'trang trí', 'template', 'bản mẫu'];

// Hàm delay để tránh bị block API
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function fetchAllPages() {
  let pages: string[] = [];
  let apfrom: string | undefined = undefined;

  console.log("Đang lấy danh sách các trang...");
  
  while (true) {
    const params: any = {
      action: 'query',
      list: 'allpages',
      aplimit: 500,
      apnamespace: 0, // Chỉ lấy không gian tên chính (bài viết)
      format: 'json'
    };
    
    if (apfrom) {
      params.apfrom = apfrom;
    }

    try {
      const response = await axios.get(API_BASE, { params });
      const data = response.data;
      
      if (data.query && data.query.allpages) {
        const batch = data.query.allpages.map((p: any) => p.title);
        pages = pages.concat(batch);
      }

      if (data.continue && data.continue.apcontinue) {
        apfrom = data.continue.apcontinue;
      } else {
        break;
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách trang:", error);
      break;
    }
  }

  console.log(`Đã tìm thấy ${pages.length} trang.`);
  return pages;
}

// Xử lý và lưu ảnh lên Supabase Storage
async function uploadImageToSupabase(imageUrl: string, title: string): Promise<string | null> {
  if (!imageUrl) return null;
  // Fandom thường chứa /revision/latest trong URL, lấy URL cơ bản để tải ảnh gốc
  let cleanUrl = imageUrl.split('/revision/latest')[0];
  if (cleanUrl.startsWith('data:image')) return null; // Bỏ qua base64
  
  try {
    const response = await axios.get(cleanUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    
    // Tạo tên file từ title
    const ext = path.extname(new URL(cleanUrl).pathname) || '.png';
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}${ext}`;
    
    const { data, error } = await supabase.storage
      .from('wiki-images')
      .upload(filename, buffer, {
        contentType: response.headers['content-type'] as string | undefined,
        upsert: true
      });
      
    if (error) {
      console.error(`Lỗi upload ảnh ${filename}:`, error.message);
      return null;
    }
    
    const publicUrl = supabase.storage.from('wiki-images').getPublicUrl(filename).data.publicUrl;
    return publicUrl;
  } catch (error: any) {
    console.error(`Lỗi tải ảnh từ URL ${cleanUrl}:`, error.message);
    return null;
  }
}

async function processPage(title: string) {
  try {
    const params = {
      action: 'parse',
      page: title,
      prop: 'text|categories',
      format: 'json'
    };
    const response = await axios.get(API_BASE, { params });
    const data = response.data;

    if (data.error) {
      console.log(`Bỏ qua trang "${title}": ${data.error.info}`);
      return;
    }

    const categories = (data.parse.categories || []).map((c: any) => c['*'].toLowerCase());
    
    // Kiểm tra danh mục loại trừ
    const shouldExclude = categories.some((c: string) => 
      EXCLUDED_CATEGORIES.some(excluded => c.includes(excluded))
    );

    if (shouldExclude) {
      console.log(`Bỏ qua trang "${title}" vì thuộc danh mục bị loại trừ.`);
      return;
    }

    const htmlContent = data.parse.text['*'];
    const $ = cheerio.load(htmlContent);
    
    // Trích xuất Infobox
    let infoboxJson: any = {};
    const infobox = $('.infobox');
    let imageUrl: string | null = null;
    
    if (infobox.length > 0) {
      // Tìm ảnh trong infobox
      const img = infobox.find('img').first();
      if (img.length > 0) {
        imageUrl = img.attr('src') || img.attr('data-src') || null;
      }
      
      // Đọc các hàng trong infobox
      infobox.find('tr').each((i, row) => {
        const header = $(row).find('th').text().trim();
        const data = $(row).find('td').text().trim();
        if (header && data) {
          infoboxJson[header] = data;
        }
      });
    }

    // Xóa các thành phần không cần thiết để lấy content sạch
    $('.infobox').remove();
    $('.toc').remove();
    $('.mw-editsection').remove();
    $('.navbox').remove();
    $('script').remove();
    
    let cleanHtml = $('body').html() || '';
    
    // Trích xuất summary (đoạn văn bản đầu tiên)
    let summary = '';
    $('p').each((i, p) => {
      const text = $(p).text().trim();
      if (text.length > 20) { // Bỏ qua đoạn quá ngắn
        summary = text;
        return false; // Break loop
      }
    });

    // Tạo slug
    const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Upload ảnh
    let publicImageUrl = null;
    if (imageUrl) {
      publicImageUrl = await uploadImageToSupabase(imageUrl, slug);
    }

    // Category chính
    const mainCategory = categories.length > 0 ? categories[0] : null;

    // Lưu vào database
    const { error } = await supabase.from('pages').upsert({
      title: title,
      slug: slug,
      category: mainCategory,
      summary: summary,
      content_html: cleanHtml,
      infobox_json: infoboxJson,
      image_url: publicImageUrl
    }, { onConflict: 'slug' });

    if (error) {
      console.error(`Lỗi khi insert "${title}":`, error.message);
    } else {
      console.log(`Đã lưu trang: "${title}"`);
    }

  } catch (error: any) {
    console.error(`Lỗi xử lý trang "${title}":`, error.message);
  }
}

async function startCrawler() {
  const pages = await fetchAllPages();
  // Giới hạn chạy một vài trang đầu tiên để test, hoặc chạy hết
  // Uncomment dòng dưới nếu muốn test trước 5 trang
  // const pagesToCrawl = pages.slice(0, 5);
  const pagesToCrawl = pages;

  for (const page of pagesToCrawl) {
    await processPage(page);
    await delay(500); // Tạm dừng 0.5s giữa các request để tránh spam API
  }
  
  console.log("Hoàn thành cào dữ liệu!");
}

startCrawler();
