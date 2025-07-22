/**
 * 资源优化脚本
 * 
 * 此脚本用于优化网站资源，以提高加载速度和性能
 * 需要Node.js环境运行
 * 
 * 使用方法:
 * 1. 安装依赖: npm install terser clean-css-cli html-minifier-terser imagemin-cli
 * 2. 运行脚本: node scripts/optimize-for-deployment.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const config = {
  // 源文件目录
  jsDir: './js',
  cssDir: './styles',
  htmlFiles: ['./index.html'],
  imageDir: './assets',
  
  // 输出目录
  outputDir: './dist',
  
  // 是否覆盖原文件
  overwrite: false
};

// 创建输出目录
function createOutputDirs() {
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir);
  }
  
  const dirs = [
    path.join(config.outputDir, 'js'),
    path.join(config.outputDir, 'styles'),
    path.join(config.outputDir, 'assets')
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  }
}

// 压缩JavaScript文件
function minifyJS() {
  console.log('正在压缩JavaScript文件...');
  
  try {
    const jsFiles = fs.readdirSync(config.jsDir)
      .filter(file => file.endsWith('.js'));
    
    for (const file of jsFiles) {
      const inputPath = path.join(config.jsDir, file);
      const outputPath = config.overwrite 
        ? inputPath 
        : path.join(config.outputDir, 'js', file);
      
      const command = `npx terser ${inputPath} -o ${outputPath} -c -m`;
      execSync(command);
      console.log(`✅ 已压缩: ${file}`);
    }
  } catch (error) {
    console.error('JavaScript压缩失败:', error);
  }
}

// 压缩CSS文件
function minifyCSS() {
  console.log('正在压缩CSS文件...');
  
  try {
    const cssFiles = fs.readdirSync(config.cssDir)
      .filter(file => file.endsWith('.css'));
    
    for (const file of cssFiles) {
      const inputPath = path.join(config.cssDir, file);
      const outputPath = config.overwrite 
        ? inputPath 
        : path.join(config.outputDir, 'styles', file);
      
      const command = `npx cleancss -o ${outputPath} ${inputPath}`;
      execSync(command);
      console.log(`✅ 已压缩: ${file}`);
    }
  } catch (error) {
    console.error('CSS压缩失败:', error);
  }
}

// 压缩HTML文件
function minifyHTML() {
  console.log('正在压缩HTML文件...');
  
  try {
    for (const file of config.htmlFiles) {
      const outputPath = config.overwrite 
        ? file 
        : path.join(config.outputDir, path.basename(file));
      
      const command = `npx html-minifier-terser --collapse-whitespace --remove-comments --remove-optional-tags --remove-redundant-attributes --remove-script-type-attributes --remove-tag-whitespace --use-short-doctype --minify-css true --minify-js true -o ${outputPath} ${file}`;
      execSync(command);
      console.log(`✅ 已压缩: ${file}`);
    }
  } catch (error) {
    console.error('HTML压缩失败:', error);
  }
}

// 优化图片
function optimizeImages() {
  console.log('正在优化图片...');
  
  try {
    const outputDir = config.overwrite 
      ? config.imageDir 
      : path.join(config.outputDir, 'assets');
    
    const command = `npx imagemin "${config.imageDir}/*.{jpg,png,svg,gif}" --out-dir=${outputDir}`;
    execSync(command);
    console.log('✅ 图片优化完成');
  } catch (error) {
    console.error('图片优化失败:', error);
  }
}

// 复制其他文件
function copyOtherFiles() {
  if (config.overwrite) return;
  
  console.log('正在复制其他文件...');
  
  try {
    // 复制根目录文件
    const rootFiles = [
      'favicon.ico',
      'manifest.json',
      'robots.txt',
      'sitemap.xml',
      'CNAME'
    ];
    
    for (const file of rootFiles) {
      if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(config.outputDir, file));
        console.log(`✅ 已复制: ${file}`);
      }
    }
    
    // 复制音频文件
    const audioFiles = fs.readdirSync(config.imageDir)
      .filter(file => file.endsWith('.mp3') || file.endsWith('.wav'));
    
    for (const file of audioFiles) {
      fs.copyFileSync(
        path.join(config.imageDir, file),
        path.join(config.outputDir, 'assets', file)
      );
      console.log(`✅ 已复制: assets/${file}`);
    }
  } catch (error) {
    console.error('文件复制失败:', error);
  }
}

// 主函数
function main() {
  console.log('开始优化资源...');
  
  if (!config.overwrite) {
    createOutputDirs();
  }
  
  minifyJS();
  minifyCSS();
  minifyHTML();
  optimizeImages();
  
  if (!config.overwrite) {
    copyOtherFiles();
  }
  
  console.log('资源优化完成!');
  
  if (!config.overwrite) {
    console.log(`优化后的文件已保存到 ${config.outputDir} 目录`);
  } else {
    console.log('原文件已被优化版本覆盖');
  }
}

// 执行主函数
main();