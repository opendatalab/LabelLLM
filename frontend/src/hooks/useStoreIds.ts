import { message } from '@/components/StaticAnt';
import { useIntl } from 'react-intl';
import store from 'storejs';

export type TStoreKey = 'data_id' | 'questionnaire_id';
export const useStoreIds = () => {
  const { formatMessage } = useIntl();
  // 保存 ids 区分
  const saveIds = async (key: TStoreKey, val: string) => {
    // val 转数组 过滤空字符串
    store.set(
      key,
      val
        .split('\n')
        ?.map((item) => item.trim())
        .filter(Boolean),
    );
  };

  const getIds = (key: TStoreKey) => {
    return store.get(key) || [];
  };

  // 上一题 下一题
  const nextId = (id: string, key: TStoreKey, n: 1 | -1) => {
    const ids = getIds(key);
    // 获取当前 id 下标
    const index = ids.indexOf(id);
    // 获取上一个或下一个id
    const nextIndex = index + n;
    // 检查索引是否越界
    if (nextIndex < 0 || nextIndex >= ids.length) {
      message.warning(formatMessage({ id: 'task.error.msg2' }));
      return null;
    }

    return ids[nextIndex];
  };

  const clearAll = () => {
    // 退出当前页面 关闭tab都需要清除浏览器缓存 缓存的 id
    store.remove('data_id');
    store.remove('questionnaire_id');
  };

  return { saveIds, getIds, clearAll, nextId };
};
