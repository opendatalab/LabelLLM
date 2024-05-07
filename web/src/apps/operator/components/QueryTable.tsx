import type { TableProps } from 'antd';
import { Table } from 'antd';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { styled } from 'styled-components';

import type { QueryFormProps } from './QueryForm';

export interface QueryTableProps<T> extends TableProps<T> {
  onSearch?: QueryFormProps['onSearch'];
}

const StyledTable = styled<any>(Table)`
  .ant-table-thead > tr > th {
    padding: 1rem 0.75rem 1rem 1.5rem;
  }

  .ant-table-footer {
    background-color: transparent;
    padding: 1rem 1rem;
  }
`;

export default function QueryTable<T extends object>({ onSearch, pagination, ...rest }: QueryTableProps<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const newPagination = useMemo(() => {
    return {
      ...pagination,
      current: Number(searchParams.get('page')) || 1,
      pageSize: Number(searchParams.get('page_size')) || 10,
    };
  }, [pagination, searchParams]);

  const handleTableChange: TableProps<T>['onChange'] = (tablePagination, filters, sorter) => {
    if (tablePagination.current) {
      searchParams.set('page', tablePagination.current.toString());
    }

    if (tablePagination.pageSize) {
      searchParams.set('page_size', tablePagination.pageSize.toString());
    }

    // @ts-ignore
    if (sorter.field) {
      // @ts-ignore
      const orderMap = sorter?.column?.orderMap || {};
      // @ts-ignore
      const order = orderMap[sorter.order] || sorter.order;

      if (order) {
        // @ts-ignore
        searchParams.set('sort', order ? `${sorter.field}_${order}` : sorter.field);
      } else {
        searchParams.delete('sort');
      }
    }

    setSearchParams(searchParams);
    onSearch?.(Object.fromEntries(searchParams.entries()));
  };

  return <StyledTable onChange={handleTableChange} {...rest} pagination={newPagination} />;
}
