import _ from 'lodash';

import type { ConditionItem } from '@/apps/supplier/services/task';

import type { Question, QuestionOption, TaskToolConfig } from '../../services/task';
import { mapTree } from '../../utils/mapTree';

export function validateOptions(values: TaskToolConfig) {
  return _.chain(values)
    .pick(['message', 'conversation', 'question'])
    .toPairs()
    .every(([, item]) => {
      return _.chain(item)
        .get('questions')
        .filter((question: Question) => ['enum', 'array'].includes(question.type))
        .every((question) => {
          return question.options ? question.options.length > 0 : false;
        })
        .value();
    })
    .value();
}

export function filterInvalidConditions(values: TaskToolConfig) {
  const items = _.chain(values)
    .pick(['message', 'conversation', 'question'])
    .toPairs()
    .map(([, item]) => {
      return _.get(item, 'questions', []);
    })
    .flatten()
    .value();

  const questionMap = _.chain(items)
    .map((question: Question) => {
      return [question.id, question];
    })
    .fromPairs()
    .value();

  const optionsMap = _.chain(items)
    .map((question: Question) => {
      return question.options || [];
    })
    .flatten()
    .map((option: QuestionOption) => {
      return [option.id, option];
    })
    .fromPairs()
    .value();

  const result = _.cloneDeep(values);

  _.chain(result)
    .pick(['message', 'conversation', 'question'])
    .toPairs()
    .forEach(([, item]) => {
      _.forEach(item.questions, (question) => {
        question.conditions = mapTree<ConditionItem>(question.conditions, (_item) => {
          return {
            ..._item,
            items: _item.items?.filter((condition) => {
              return condition.question_id in questionMap && condition.option_id in optionsMap;
            }),
          };
        });
      });
    })
    .value();

  return result;
}

export function isIdUnique(values: TaskToolConfig) {
  const items = _.chain(values)
    .pick(['message', 'conversation', 'question'])
    .toPairs()
    .map(([, item]) => {
      return _.get(item, 'questions', []);
    })
    .flatten()
    .value();

  const questionMap = _.chain(items)
    .map((question: Question) => {
      return [question.id, question];
    })
    .fromPairs()
    .value();

  const optionsMap = _.chain(items)
    .map((question: Question) => {
      return question.options || [];
    })
    .flatten()
    .map((option: QuestionOption) => {
      return [option.id, option];
    })
    .fromPairs()
    .value();

  const isQuestionIdUnique = _.keys(questionMap).length === items.length;

  const options = _.chain(items)
    .map((question: Question) => {
      return question.options || [];
    })
    .flatten()
    .value();

  const isOptionIdUnique = _.keys(optionsMap).length === options.length;

  return isQuestionIdUnique && isOptionIdUnique;
}
