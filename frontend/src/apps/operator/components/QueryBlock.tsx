import _ from 'lodash';

import type { QueryFormProps } from './QueryForm';
import QueryForm from './QueryForm';
import type { QueryTableProps } from './QueryTable';
import QueryTable from './QueryTable';
import CustomEmpty from './CustomEmpty';

export interface QueryBlockProps<T> {
  formProps: QueryFormProps;
  tableProps: QueryTableProps<T>;
  emptyDescription?: string;
  onSearch?: QueryFormProps['onSearch'];
}

export default function QueryBlock<T extends object>({
  emptyDescription,
  onSearch,
  formProps,
  tableProps,
}: QueryBlockProps<T>) {
  let content = (
    <QueryTable<T> pagination={{ size: 'default', showQuickJumper: true }} onSearch={onSearch} {...tableProps} />
  );

  if (_.isEmpty(tableProps.dataSource) && !tableProps.loading) {
    content = (
      <div className="m-auto">
        <CustomEmpty description={emptyDescription} />
      </div>
    );
  }

  return (
    <>
      <QueryForm className="mb-4" onSearch={onSearch} {...formProps} />
      {content}
    </>
  );
}
