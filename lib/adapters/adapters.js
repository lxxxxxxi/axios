import utils from '../utils.js';
import httpAdapter from './http.js';
import xhrAdapter from './xhr.js';
import fetchAdapter from './fetch.js';
import AxiosError from "../core/AxiosError.js";

const knownAdapters = {
  http: httpAdapter,
  xhr: xhrAdapter,
  fetch: fetchAdapter
}

// 将适配器的名称和 adapterName 属性设置为适配器的键名。
utils.forEach(knownAdapters, (fn, value) => {
  // 每个适配器添加 name 和 adapterName 属性，表示适配器的名称。
  if (fn) {
    try {
      Object.defineProperty(fn, 'name', { value });
    } catch (e) {
      // eslint-disable-next-line no-empty
    }
    Object.defineProperty(fn, 'adapterName', { value });
  }
});

const renderReason = (reason) => `- ${reason}`;

// 检查适配器是否是函数、null 或 false，用于确定适配器是否已解决。
const isResolvedHandle = (adapter) => utils.isFunction(adapter) || adapter === null || adapter === false;

export default {
  getAdapter: (adapters) => {
    // 将 adapters 转换为数组，如果不是数组则将其包裹在数组中。
    adapters = utils.isArray(adapters) ? adapters : [adapters];

    // 变量声明
    const { length } = adapters;
    let nameOrAdapter;
    let adapter;

    const rejectedReasons = {};

    // 遍历适配器数组
    for (let i = 0; i < length; i++) {
      nameOrAdapter = adapters[i];
      let id;

      adapter = nameOrAdapter;

      // 检查当前适配器是否已解析
      if (!isResolvedHandle(nameOrAdapter)) {
        // 如果未解析，从 knownAdapters 中查找对应的适配器。
        adapter = knownAdapters[(id = String(nameOrAdapter)).toLowerCase()];

        // 如果找不到适配器，抛出 Unknown adapter 错误。
        if (adapter === undefined) {
          throw new AxiosError(`Unknown adapter '${id}'`);
        }
      }

      if (adapter) {
        break;
      }

      rejectedReasons[id || '#' + i] = adapter;
    }

    // 如果未找到适配器，生成拒绝原因列表。
    if (!adapter) {

      const reasons = Object.entries(rejectedReasons)
        .map(([id, state]) => `adapter ${id} ` +
          (state === false ? 'is not supported by the environment' : 'is not available in the build')
        );

      let s = length ?
        (reasons.length > 1 ? 'since :\n' + reasons.map(renderReason).join('\n') : ' ' + renderReason(reasons[0])) :
        'as no adapter specified';

      throw new AxiosError(
        `There is no suitable adapter to dispatch the request ` + s,
        'ERR_NOT_SUPPORT'
      );
    }

    return adapter;
  },
  adapters: knownAdapters
}
