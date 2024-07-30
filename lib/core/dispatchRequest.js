'use strict';

import transformData from './transformData.js';
import isCancel from '../cancel/isCancel.js';
import defaults from '../defaults/index.js';
import CanceledError from '../cancel/CanceledError.js';
import AxiosHeaders from '../core/AxiosHeaders.js';
import adapters from "../adapters/adapters.js";

/**
 * Throws a `CanceledError` if cancellation has been requested.
 *
 * @param {Object} config The config that is to be used for the request
 *
 * @returns {void}
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }

  if (config.signal && config.signal.aborted) {
    throw new CanceledError(null, config);
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 * 该函数将使用配置的适配器向服务器发送请求。
 *
 * @param {object} config The config that is to be used for the request
 *
 * @returns {Promise} The Promise to be fulfilled
 */
export default function dispatchRequest(config) {
  throwIfCancellationRequested(config); // 检查是否有取消请求的标志。如果有，抛出一个取消错误。

  config.headers = AxiosHeaders.from(config.headers); // 将 config.headers 转换为 AxiosHeaders 实例，以便更方便地操作请求头。

  // Transform request data
  // 调用 transformData 函数，将请求数据转换为字符串。
  config.data = transformData.call(
    config,
    config.transformRequest
  );

  // 如果请求方法是 post、put 或 patch，则设置请求头的 Content-Type 为 application/x-www-form-urlencoded。
  if (['post', 'put', 'patch'].indexOf(config.method) !== -1) {
    config.headers.setContentType('application/x-www-form-urlencoded', false);
  }

  // 获取适配器
  const adapter = adapters.getAdapter(config.adapter || defaults.adapter);

  // 调用适配器函数 adapter(config) 发送请求，返回一个 Promise。
  return adapter(config).then(function onAdapterResolution(response) {
    // 使用 then 方法处理请求成功的情况，在处理响应前再次检查取消请求标志。
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData.call(
      config,
      config.transformResponse,
      response
    );

    // 将响应头转换为 AxiosHeaders 实例。
    response.headers = AxiosHeaders.from(response.headers);

    // 返回处理后的响应对象。
    return response;
  }, function onAdapterRejection(reason) {
    // 处理请求失败的情况

    // 如果错误原因不是取消请求，重新检查取消请求标志。
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData.call(
          config,
          config.transformResponse,
          reason.response
        );
        reason.response.headers = AxiosHeaders.from(reason.response.headers);
      }
    }

    // 将处理后的错误原因封装在 Promise 拒绝中返回。
    return Promise.reject(reason);
  });
}
