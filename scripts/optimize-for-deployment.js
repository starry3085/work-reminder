/**
 * 资源优化脚本
 * 
 * 此脚本用于优化网站资源，以提高加载速度和性能
 * 需要Node.js环境运行
 * 
 * 使用方法:
 * 1. 安装依赖: npm install
 * 2. 运行脚本: npm run optimize
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// 配置
const config = {
  // 源文件目录
  jsDir: './js',
  cssDir: './styles',
  htmlFiles: ['./index.html', './404.html'],
  imageDir: './assets',
  
  // 输出目录
  outputDir: './dist',
  
  // 是否覆盖原文件
  overwrite: false,
  
  // 是否添加内容哈希到文件名
  addHash: true,
  
  // 是否生成sourcemap
  generateSourcemap: false,
  
  // 是否生成gzip版本
  generateGzip: true,
  
  // 是否生成service worker
  generateServiceWorker: true
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
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// 生成文件哈希
function generateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('md5');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex').substring(0, 8);
}

// 压缩JavaScript文件
function minifyJS() {
  console.log('正在压缩JavaScript文件...');
  
  try {
    const jsFiles = fs.readdirSync(config.jsDir)
      .filter(file => file.endsWith('.js'));
    
    const fileMap = {};
    
    for (const file of jsFiles) {
      const inputPath = path.join(config.jsDir, file);
      let outputFileName = file;
      
      // 添加内容哈希到文件名
      if (config.addHash && !config.overwrite) {
        const hash = generateFileHash(inputPath);
        const fileNameWithoutExt = file.replace('.js', '');
        outputFileName = `${fileNameWithoutExt}.${hash}.js`;
        fileMap[file] = outputFileName;
      }
      
      const outputPath = config.overwrite 
        ? inputPath 
        : path.join(config.outputDir, 'js', outputFileName);
      
      let command = `npx terser ${inputPath} -o ${outputPath} -c passes=2 -m`;
      
      // 生成sourcemap
      if (config.generateSourcemap && !config.overwrite) {
        command += ` --source-map "filename='${outputFileName}.map',url='${outputFileName}.map'"`;
      }
      
      execSync(command);
      console.log(`✅ 已压缩: ${file} -> ${outputFileName}`);
      
      // 生成gzip版本
      if (config.generateGzip && !config.overwrite) {
        execSync(`gzip -c ${outputPath} > ${outputPath}.gz`);
        console.log(`✅ 已生成gzip: ${outputFileName}.gz`);
      }
    }
    
    return fileMap;
  } catch (error) {
    console.error('JavaScript压缩失败:', error);
    return {};
  }
}

// 压缩CSS文件
function minifyCSS() {
  console.log('正在压缩CSS文件...');
  
  try {
    const cssFiles = fs.readdirSync(config.cssDir)
      .filter(file => file.endsWith('.css'));
    
    const fileMap = {};
    
    for (const file of cssFiles) {
      const inputPath = path.join(config.cssDir, file);
      let outputFileName = file;
      
      // 添加内容哈希到文件名
      if (config.addHash && !config.overwrite) {
        const hash = generateFileHash(inputPath);
        const fileNameWithoutExt = file.replace('.css', '');
        outputFileName = `${fileNameWithoutExt}.${hash}.css`;
        fileMap[file] = outputFileName;
      }
      
      const outputPath = config.overwrite 
        ? inputPath 
        : path.join(config.outputDir, 'styles', outputFileName);
      
      const command = `npx cleancss -O2 -o ${outputPath} ${inputPath}`;
      execSync(command);
      console.log(`✅ 已压缩: ${file} -> ${outputFileName}`);
      
      // 生成gzip版本
      if (config.generateGzip && !config.overwrite) {
        execSync(`gzip -c ${outputPath} > ${outputPath}.gz`);
        console.log(`✅ 已生成gzip: ${outputFileName}.gz`);
      }
    }
    
    return fileMap;
  } catch (error) {
    console.error('CSS压缩失败:', error);
    return {};
  }
}

// 压缩HTML文件并更新资源引用
function minifyHTML(jsFileMap, cssFileMap) {
  console.log('正在压缩HTML文件...');
  
  try {
    for (const file of config.htmlFiles) {
      // 先读取HTML内容
      let htmlContent = fs.readFileSync(file, 'utf8');
      
      // 如果启用了哈希并且不是覆盖模式，更新资源引用
      if (config.addHash && !config.overwrite) {
        // 更新JS引用
        for (const [originalFile, hashedFile] of Object.entries(jsFileMap)) {
          const jsRegex = new RegExp(`(src=["'])js/${originalFile}(["'])`, 'g');
          htmlContent = htmlContent.replace(jsRegex, `$1js/${hashedFile}$2`);
        }
        
        // 更新CSS引用
        for (const [originalFile, hashedFile] of Object.entries(cssFileMap)) {
          const cssRegex = new RegExp(`(href=["'])styles/${originalFile}(["'])`, 'g');
          htmlContent = htmlContent.replace(cssRegex, `$1styles/${hashedFile}$2`);
        }
        
        // 写入临时文件
        const tempFile = `${file}.temp`;
        fs.writeFileSync(tempFile, htmlContent);
        
        const outputPath = config.overwrite 
          ? file 
          : path.join(config.outputDir, path.basename(file));
        
        // 压缩HTML
        const command = `npx html-minifier-terser --collapse-whitespace --remove-comments --remove-optional-tags --remove-redundant-attributes --remove-script-type-attributes --remove-tag-whitespace --use-short-doctype --minify-css true --minify-js true -o ${outputPath} ${tempFile}`;
        execSync(command);
        
        // 删除临时文件
        fs.unlinkSync(tempFile);
      } else {
        const outputPath = config.overwrite 
          ? file 
          : path.join(config.outputDir, path.basename(file));
        
        // 直接压缩HTML
        const command = `npx html-minifier-terser --collapse-whitespace --remove-comments --remove-optional-tags --remove-redundant-attributes --remove-script-type-attributes --remove-tag-whitespace --use-short-doctype --minify-css true --minify-js true -o ${outputPath} ${file}`;
        execSync(command);
      }
      
      console.log(`✅ 已压缩: ${file}`);
      
      // 生成gzip版本
      if (config.generateGzip && !config.overwrite) {
        const outputPath = path.join(config.outputDir, path.basename(file));
        execSync(`gzip -c ${outputPath} > ${outputPath}.gz`);
        console.log(`✅ 已生成gzip: ${path.basename(file)}.gz`);
      }
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
    
    // 优化PNG、JPG、GIF图片
    const command = `npx imagemin "${config.imageDir}/*.{jpg,png,gif}" --out-dir=${outputDir}`;
    execSync(command);
    
    // 优化SVG图片
    const svgCommand = `npx imagemin "${config.imageDir}/*.svg" --out-dir=${outputDir}`;
    try {
      execSync(svgCommand);
    } catch (e) {
      // 如果没有SVG文件，忽略错误
    }
    
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
    
    // 复制service worker
    if (fs.existsSync('js/service-worker.js')) {
      fs.copyFileSync(
        'js/service-worker.js',
        path.join(config.outputDir, 'service-worker.js')
      );
      console.log('✅ 已复制: service-worker.js 到根目录');
    }
  } catch (error) {
    console.error('文件复制失败:', error);
  }
}

// 生成缓存清单
function generateCacheManifest() {
  if (config.overwrite) return;
  
  console.log('正在生成缓存清单...');
  
  try {
    const walkSync = (dir, filelist = []) => {
      fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        try {
          filelist = fs.statSync(dirFile).isDirectory()
            ? walkSync(dirFile, filelist)
            : filelist.concat(path.relative(config.outputDir, dirFile).replace(/\\/g, '/'));
        } catch (err) {
          console.error(`无法访问文件 ${dirFile}:`, err);
        }
      });
      return filelist;
    };
    
    const files = walkSync(config.outputDir)
      .filter(file => !file.endsWith('.gz') && !file.endsWith('.map'));
    
    const manifest = {
      name: 'office-wellness-reminder',
      version: new Date().toISOString(),
      timestamp: Date.now(),
      files: files
    };
    
    fs.writeFileSync(
      path.join(config.outputDir, 'cache-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    console.log('✅ 缓存清单生成完成');
  } catch (error) {
    console.error('缓存清单生成失败:', error);
  }
}

// 生成部署报告
function generateDeploymentReport() {
  if (config.overwrite) return;
  
  console.log('正在生成部署报告...');
  
  try {
    const getDirectorySize = (directory) => {
      let size = 0;
      const files = fs.readdirSync(directory);
      
      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          size += stats.size;
        } else if (stats.isDirectory()) {
          size += getDirectorySize(filePath);
        }
      }
      
      return size;
    };
    
    const formatBytes = (bytes, decimals = 2) => {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };
    
    const originalSize = getDirectorySize('./');
    const optimizedSize = getDirectorySize(config.outputDir);
    const savings = originalSize - optimizedSize;
    const savingsPercentage = ((savings / originalSize) * 100).toFixed(2);
    
    const report = {
      timestamp: new Date().toISOString(),
      originalSize: formatBytes(originalSize),
      optimizedSize: formatBytes(optimizedSize),
      savings: formatBytes(savings),
      savingsPercentage: `${savingsPercentage}%`,
      configuration: {
        addHash: config.addHash,
        generateSourcemap: config.generateSourcemap,
        generateGzip: config.generateGzip,
        generateServiceWorker: config.generateServiceWorker
      }
    };
    
    fs.writeFileSync(
      path.join(config.outputDir, 'optimization-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('✅ 部署报告生成完成');
    console.log(`📊 优化结果: ${report.originalSize} -> ${report.optimizedSize} (节省 ${report.savings}, ${report.savingsPercentage})`);
  } catch (error) {
    console.error('部署报告生成失败:', error);
  }
}

// 主函数
async function main() {
  console.log('开始优化资源...');
  
  if (!config.overwrite) {
    createOutputDirs();
  }
  
  const jsFileMap = minifyJS();
  const cssFileMap = minifyCSS();
  minifyHTML(jsFileMap, cssFileMap);
  optimizeImages();
  
  if (!config.overwrite) {
    copyOtherFiles();
    generateCacheManifest();
    generateDeploymentReport();
  }
  
  console.log('资源优化完成!');
  
  if (!config.overwrite) {
    console.log(`优化后的文件已保存到 ${config.outputDir} 目录`);
  } else {
    console.log('原文件已被优化版本覆盖');
  }
}

// 执行主函数
main().catch(error => {
  console.error('优化过程中发生错误:', error);
  process.exit(1);
});