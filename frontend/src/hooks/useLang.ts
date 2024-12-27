import { useQueryClient, useQuery } from '@tanstack/react-query';
import store from 'storejs';

const UseLang = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['lang'],
    queryFn: async () => store.get('lang') || 'zh-CN',
  });
  // 更新
  const setLang = (value: 'zh-CN' | 'en-US') => {
    store.set('lang', value);
    queryClient.refetchQueries({ queryKey: ['lang'] });
  };
  return { setLang, lang: query.data, isZh: query.data === 'zh-CN' };
};

export default UseLang;
