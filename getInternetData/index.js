const https = require('https');
const fs = require("fs");
const XLSX = require('xlsx');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { xiaohongshuData, xiaohongshuConfig, ipAndPort, taobaoData } = require('./extractData.js');
const { columnNameDict, fileNameHeader } = xiaohongshuConfig
// 读取配置文件
const { proxyList, url } = JSON.parse(fs.readFileSync('config.json', 'utf8'));


// 随机选择一个代理
function getRandomProxy() {
    const randomIndex = Math.floor(Math.random() * proxyList.length);
    console.log(`这次使用的代理服务器：${proxyList[randomIndex]}`);
    return proxyList[randomIndex];
}

// 添加请求拦截器
axios.interceptors.request.use(config => {
    // console.log('代理:', config.httpsAgent ? config.httpsAgent.proxy : '无');
    return config;
}, error => {
    console.error('请求拦截器出错:', error);
    return Promise.reject(error);
});


let result = [];
async function fetchData() {
    try {
        const proxy = getRandomProxy();
        const agent = new HttpsProxyAgent({
            host: new URL(proxy).hostname,
            port: new URL(proxy).port,
            rejectUnauthorized: false
        });

        const response = await axios.get(url, {
            httpsAgent: agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            // 直接在 axios 请求中设置忽略证书验证
            validateStatus: function(status) {
                return status >= 200 && status < 500;
            },
            httpsAgent: new (require('https').Agent)({
                rejectUnauthorized: false
            })
        });
        // 调用封装的方法提取数据，传入 HTML 字符串
        result = taobaoData(response.data);

        // 获取当前日期
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateString = `${year}${month}${day}`;

        // 生成文件名
        const fileName = `${fileNameHeader}_data_${dateString}.xlsx`;

        // 获取数据的表头
        const headers = columnNameDict;


        let workbook, worksheet;
        let startRow = 1; // 默认从第二行开始写（第一行是表头）
        const fileStatus = fs.existsSync(fileName)
        if (fileStatus) {
            // 读取已有 Excel
            workbook = XLSX.readFile(fileName);
            worksheet = workbook.Sheets[workbook.SheetNames[0]];

            if (worksheet['!ref']) {
                // 获取已有数据的最后一行索引
                const range = XLSX.utils.decode_range(worksheet['!ref']);
                startRow = range.e.r + 1; // 下一行索引
            }
        } else {
            // 创建新的工作簿
            workbook = XLSX.utils.book_new();
            worksheet = XLSX.utils.aoa_to_sheet([headers]); // 设置表头
            worksheet['!cols'] = headers.map(() => ({ wpx: 100 })); // 设置列宽
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        }
        if (result?.length) {
            // 追加新数据
            XLSX.utils.sheet_add_aoa(worksheet, result, { origin: startRow });

            // 设置表头的中文名称
            headers.forEach((_, i) => {
                const cell = XLSX.utils.encode_cell({ r: 0, c: i });
                worksheet[cell].v = columnNameDict[i];
            });

            // 更新工作簿
            XLSX.writeFile(workbook, fileName);
            fileStatus ? console.log(`数据已成功追加到 ${fileName}，起始行号: ${startRow}`) : console.log(`数据已成功写入 ${fileName} 文件`);
        } else {
            console.error("没有获得数据");
        }

    } catch (error) {
        console.error(`请求出错: ${error.message}`);
    }
}

fetchData();