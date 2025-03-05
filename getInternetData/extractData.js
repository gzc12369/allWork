// extractData.js
const cheerio = require('cheerio');
const path = require('path');
const fs = require("fs");
// 定义 JSON 文件路径
const filePath = path.join(__dirname, 'config.json');
// 小红书
const xiaohongshuConfig = {
    columnNameDict: [
        "笔记标题",
        "用户名",
        "点赞数",
        "笔记链接",
        "笔记首图"
    ],
    fileNameHeader: "xiaohongshu"
}
function xiaohongshuData(html) {
    let result = [];
    const $ = cheerio.load(html);
    $('section').each((index, section) => {
        const title = $(section).find('.title').text();
        const name = $(section).find('.name').text();
        const count = $(section).find('.count').text();
        const hrefValue = $(section).find('.cover').attr('href');
        const firstImg = $(section).find('.cover img').attr('src');

        const item = [
            title,
            name,
            count,
            `https://www.xiaohongshu.com${hrefValue}`,
            firstImg
        ];
        result.push(item);
    });
    return result;
}
function taobaoData(html) {
    let result = [];
    const $ = cheerio.load(html);
    $('.title--qJ7Xg_90').each((index, section) => {
        // const title = $(section).find('span').text();
        // console.log(title);
        // const item = [
        //     title
        // ];
        // result.push(item);
    });
    console.log(result);
    return result;
}

// 获取代理服务器
function ipAndPort(html) {
    let result = [];
    // 使用正则表达式提取 fpsList 的定义
    const regex = /const fpsList = (\[.*?\]);/s;
    const match = html.match(regex);

    if (match) {
        const fpsListString = match[1];
        try {
            // 解析 JSON 数据
            const fpsList = JSON.parse(fpsListString);
            // console.log('提取到的代理服务器:', fpsList);
            // 遍历 fpsList 数组
            for (let item of fpsList) {
                const { ip, port } = item;
                result.push(`http://${ip}:${port}`);
            }
        } catch (parseError) {
            console.error('解析 JSON 数据时出错:', parseError);
        }
    } else {
        console.log('未找到 fpsList 的定义');
    }

    updateJsonFile("proxyListTest", result);
}
function updateJsonFile(fieldName, fieldValue) {
    try {
        let jsonData;
        try {
            // 尝试读取文件内容
            jsonData = JSON.parse(fs.readFileSync('config.json', 'utf8'));
        } catch (readError) {
            // 如果文件不存在，初始化为空对象
            if (readError.code === 'ENOENT') {
                jsonData = {};
            } else {
                throw readError;
            }
        }
        // 添加或覆盖字段
        jsonData[fieldName] = fieldValue;
        // 将更新后的对象转换为格式化的 JSON 字符串
        const updatedJson = JSON.stringify(jsonData, null, 2);
        // 写入更新后的 JSON 数据到文件
        fs.writeFileSync(filePath, updatedJson, 'utf8');
        console.log('数据已成功更新到 JSON 文件');
    } catch (error) {
        console.error('操作过程中出现错误:', error);
    }
}

module.exports = {
    xiaohongshuConfig,
    xiaohongshuData,
    ipAndPort,
    taobaoData
};