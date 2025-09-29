#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

/**
 * 将 SVG 转换为 PNG
 * @param {string} svgPath SVG 文件路径
 * @param {string} pngPath PNG 输出路径
 * @param {number} size 输出尺寸
 */
async function convertSvgToPng(svgPath, pngPath, size) {
  try {
    // 读取 SVG 文件内容
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    
    // 创建一个 SVG data URL
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
    
    // 创建 canvas 并设置尺寸
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // 设置白色背景（可选）
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);
    
    // 加载并绘制 SVG
    const image = await loadImage(svgDataUrl);
    ctx.drawImage(image, 0, 0, size, size);
    
    // 保存为 PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(pngPath, buffer);
    
    console.log(`✅ 已生成: ${pngPath} (${size}x${size})`);
  } catch (error) {
    console.error(`❌ 转换失败: ${svgPath}`, error.message);
  }
}

/**
 * 主函数
 */
async function main() {
  const assetsDir = path.join(__dirname, '../assets');
  const sizes = [16, 32, 48, 128];
  
  console.log('🚀 开始转换 SVG 图标为 PNG...\n');
  
  // 检查 assets 目录
  if (!fs.existsSync(assetsDir)) {
    console.error('❌ assets 目录不存在');
    process.exit(1);
  }
  
  // 转换每个尺寸的图标
  for (const size of sizes) {
    const svgFile = `icon${size}.svg`;
    const pngFile = `icon${size}.png`;
    const svgPath = path.join(assetsDir, svgFile);
    const pngPath = path.join(assetsDir, pngFile);
    
    if (fs.existsSync(svgPath)) {
      await convertSvgToPng(svgPath, pngPath, size);
    } else {
      console.warn(`⚠️  SVG 文件不存在: ${svgPath}`);
    }
  }
  
  console.log('\n✨ 图标转换完成！');
}

// 运行脚本
main().catch(console.error);