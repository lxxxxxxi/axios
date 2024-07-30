'use strict';

import utils from './../utils.js';
import defaults from '../defaults/index.js';
import AxiosHeaders from '../core/AxiosHeaders.js';

/**
 * Transform the data for a request or a response
 * 函数用于转换请求或响应的数据。它接收一个函数或函数数组作为参数，并依次调用这些函数来处理数据。
 *
 * @param {Array|Function} fns A single function or Array of functions
 * @param {?Object} response The response object
 *
 * @returns {*} The resulting transformed data
 */
export default function transformData(fns, response) {
  const config = this || defaults; // 获取配置对象，如果 `this` 为 `null` 或 `undefined`，则使用默认配置 `defaults`。
  const context = response || config; // 如果有响应对象，则使用响应对象作为上下文，否则使用配置对象。
  const headers = AxiosHeaders.from(context.headers); // 将上下文中的请求头转换为 `AxiosHeaders` 实例，以便更方便地操作请求头。
  let data = context.data; // 从上下文中获取数据。

  // 遍历 `fns` 中的每个函数。
  utils.forEach(fns, function transform(fn) {
    // 调用每个转换函数，并传递数据、标准化的请求头和（如果有）响应状态码。
    data = fn.call(config, data, headers.normalize(), response ? response.status : undefined);
  });

  headers.normalize(); // 标准化请求头。

  return data;
}
