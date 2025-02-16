import SvgIcon from '@/components/svg-icon';
import { Domain } from '@/constants/common';
import { useFetchSystemStatus, useFetchSystemVersion } from '@/hooks/user-setting-hooks';
import {
  ISystemStatus,
  TaskExecutorHeartbeatItem,
} from '@/interfaces/database/user-setting';
import { Badge, Card, Flex, Spin, Typography } from 'antd';
import classNames from 'classnames';
import lowerCase from 'lodash/lowerCase';
import upperFirst from 'lodash/upperFirst';
import { useEffect, useMemo } from 'react';

import { toFixed } from '@/utils/common-util';
import { isObject } from 'lodash';
import styles from './index.less';
import TaskBarChat from './task-bar-chat';

const { Text } = Typography;

enum Status {
  'green' = 'success',
  'red' = 'error',
  'yellow' = 'warning',
}

const TitleMap = {
  version: 'Version',
  doc_engine: 'Doc Engine',
  storage: 'Object Storage',
  redis: 'Redis',
  database: 'Database',
  task_executor_heartbeats: 'Task Executor',
};

const IconMap = {
  version: 'system',
  es: 'es',
  doc_engine: 'storage',
  redis: 'redis',
  storage: 'minio',
  database: 'database',
  task_executor_heartbeats: 'run',
};

const LogoIconKeys = ['version', 'task_executor_heartbeats'];

const getIcon = (key: string) => {
  return <SvgIcon name={IconMap[key as keyof typeof IconMap]} width={26} />;
};

const getTaskExecutorStatus = (data: Record<string, TaskExecutorHeartbeatItem[]>) => {
  // 获取所有任务列表
  const allTasks = Object.values(data).flat();
  // 按时间排序，获取最近的3个任务
  const recentTasks = allTasks.sort((a, b) => {
    return new Date(b.now).getTime() - new Date(a.now).getTime();
  }).slice(0, 3);

  if (recentTasks.length === 0) {
    return 'yellow'; // 没有任务时显示黄色
  }

  // 检查是否有失败的任务
  const hasFailedTask = recentTasks.some(task => task.failed > 0);
  if (hasFailedTask) {
    return 'red';
  }

  // 检查是否所有任务都成功
  const allSuccessful = recentTasks.every(task => task.done > 0 && task.failed === 0);
  if (allSuccessful) {
    return 'green';
  }

  return 'yellow'; // 其他情况显示黄色
};

const SystemInfo = () => {
  const {
    systemStatus,
    fetchSystemStatus,
    loading: statusLoading,
  } = useFetchSystemStatus();
  const { version, fetchSystemVersion, error: versionError, loading: versionLoading } = useFetchSystemVersion();

  useEffect(() => {
    fetchSystemStatus();
    if (location.host !== Domain) {
      fetchSystemVersion();
    }
  }, [fetchSystemStatus, fetchSystemVersion]);

  const versionStatus = useMemo(() => {
    if (versionError) {
      return 'red';
    }
    if (version) {
      return 'green';
    }
    return 'yellow';
  }, [version, versionError]);

  return (
    <section className={styles.systemInfo}>
      <Spin spinning={statusLoading || versionLoading}>
        <Flex gap={16} vertical>
          <Card
            type="inner"
            title={
              <Flex align="center" gap={10}>
                {getIcon('version')}
                <span className={styles.title}>{TitleMap.version}</span>
                <Badge
                  className={styles.badge}
                  status={Status[versionStatus as keyof typeof Status]}
                />
              </Flex>
            }
          >
            <Flex align="center" gap={16} className={styles.text}>
              <b>Version:</b>
              <Text className={classNames({ [styles.error]: versionError })}>
                {version || versionError || 'Version information not available'}
              </Text>
            </Flex>
          </Card>
          {Object.keys(systemStatus).map((key) => {
            const info = systemStatus[key as keyof ISystemStatus];
            const status = key === 'task_executor_heartbeats' && isObject(info) 
              ? getTaskExecutorStatus(info as Record<string, TaskExecutorHeartbeatItem[]>)
              : info.status;

            return (
              <Card
                type="inner"
                title={
                  <Flex align="center" gap={10}>
                    {getIcon(key)}
                    <span className={styles.title}>
                      {TitleMap[key as keyof typeof TitleMap]}
                    </span>
                    <Badge
                      className={styles.badge}
                      status={Status[status as keyof typeof Status]}
                    />
                  </Flex>
                }
                key={key}
              >
                {key === 'task_executor_heartbeats' ? (
                  isObject(info) ? (
                    <TaskBarChat
                      data={info as Record<string, TaskExecutorHeartbeatItem[]>}
                    ></TaskBarChat>
                  ) : (
                    <Text className={styles.error}>
                      {(info as { error?: string })?.error || ''}
                    </Text>
                  )
                ) : (
                  Object.keys(info)
                    .filter((x) => x !== 'status')
                    .map((x) => {
                      return (
                        <Flex
                          key={x}
                          align="center"
                          gap={16}
                          className={styles.text}
                        >
                          <b>{upperFirst(lowerCase(x))}:</b>
                          <Text
                            className={classNames({
                              [styles.error]: x === 'error',
                            })}
                          >
                            {toFixed((info as Record<string, any>)[x]) as any}
                            {x === 'elapsed' && ' ms'}
                          </Text>
                        </Flex>
                      );
                    })
                )}
              </Card>
            );
          })}
        </Flex>
      </Spin>
    </section>
  );
};

export default SystemInfo;
