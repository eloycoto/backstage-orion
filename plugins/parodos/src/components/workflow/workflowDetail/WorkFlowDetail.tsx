import { ParodosPage } from '../../ParodosPage';
import {
  Breadcrumbs,
  ContentHeader,
  InfoCard,
  Progress,
  SupportButton,
  Link,
} from '@backstage/core-components';
import {
  Box,
  Chip,
  makeStyles,
  Typography,
  Button,
  Collapse,
} from '@material-ui/core';
import { WorkFlowLogViewer } from './WorkFlowLogViewer';
import React, { useCallback, useEffect, useState } from 'react';
import { WorkFlowStepper } from './topology/WorkFlowStepper';
import { useLocation, useParams } from 'react-router-dom';
import * as urls from '../../../urls';
import {
  Status,
  WorkflowStatus,
  workflowStatusSchema,
  WorkflowTask,
  WorkStatus,
} from '../../../models/workflowTaskSchema';
import { useStore } from '../../../stores/workflowStore/workflowStore';
import { fetchApiRef, useApi } from '@backstage/core-plugin-api';
import {
  FirstTaskId,
  getWorkflowTasksForTopology,
} from '../../../hooks/getWorkflowDefinitions';
import { assert } from 'assert-ts';
import ChevronRight from '@material-ui/icons/ChevronRight';
import ChevronDown from '@material-ui/icons/KeyboardArrowDown';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
  },
  detailContainer: {
    flex: 1,
    display: 'grid',
    gridTemplateRows: '1fr auto 1fr',
    minHeight: 0,
  },
  viewerContainer: {
    display: 'grid',
    height: '100%',
    minHeight: 0,
  },
  card: {
    height: '100%',
  },
  viewMoreButton: {
    color: theme.palette.primary.main,
    textDecoration: 'underline',
  },
}));

export function WorkFlowDetail(): JSX.Element {
  const { projectId, executionId } = useParams();
  assert(!!projectId, 'no projectId param');
  const project = useStore(state => state.getProjectById(projectId));
  const { isNew = false } = useLocation().state ?? {};
  const getWorkDefinitionBy = useStore(state => state.getWorkDefinitionBy);
  const [selectedTask, setSelectedTask] = useState<string | null>('');
  const [workflowName, setWorkflowName] = useState<string>('');
  const [allTasks, setAllTasks] = useState<WorkflowTask[]>([]);
  const [log, setLog] = useState<string>(``);
  const workflowsUrl = useStore(store => store.getApiUrl(urls.Workflows));
  const styles = useStyles();
  const { fetch } = useApi(fetchApiRef);
  const [status, setStatus] = useState<Status>('IN_PROGRESS');
  const [showMoreWorkflows, setShowMoreWorkflows] = useState(false);

  useEffect(() => {
    const updateWorks = (works: WorkStatus[]) => {
      let needUpdate = false;
      // TODO: use immer here after demo
      const tasks = [...allTasks];
      for (const work of works) {
        if (work.type === 'TASK') {
          const foundTask = tasks.find(task => task.id === work.name);

          if (foundTask && foundTask.status !== work.status) {
            foundTask.status = work.status;
            needUpdate = true;
          }
          if (foundTask && work.alertMessage !== foundTask?.alertMessage) {
            foundTask.alertMessage = work.alertMessage;
            needUpdate = true;
          }
        } else if (work.works) {
          updateWorks(work.works);
        }
      }
      if (needUpdate) {
        setAllTasks(tasks);
      }
    };

    const updateWorksFromApi = async () => {
      const data = await fetch(`${workflowsUrl}/${executionId}/status`);
      const response = workflowStatusSchema.parse(
        (await data.json()) as WorkflowStatus,
      );

      if (response.status === 'FAILED') {
        setStatus(response.status);
      }

      const workflow = getWorkDefinitionBy('byName', response.workFlowName);
      if (workflow && allTasks.length === 0) {
        setAllTasks(getWorkflowTasksForTopology(workflow));
      }
      setWorkflowName(response.workFlowName);
      updateWorks(response.works);

      return response.works;
    };

    const taskInterval = setInterval(() => {
      updateWorksFromApi();
    }, 5000);

    updateWorksFromApi();

    // TOOD: review after Demo
    // if (status === 'FAILED') {
    //   clearInterval(taskInterval);
    // }

    return () => clearInterval(taskInterval);
  }, [
    allTasks,
    executionId,
    fetch,
    workflowsUrl,
    getWorkDefinitionBy,
    selectedTask,
    status,
  ]);

  useEffect(() => {
    const updateWorkFlowLogs = async () => {
      const selected = allTasks.find(task => task.id === selectedTask);
      if (selectedTask === FirstTaskId) {
        setLog('Start workflow');
        return;
      }

      if (selected && selected?.status === 'PENDING') {
        setLog('Pending....');
        return;
      }

      if (selectedTask === '') {
        setLog('');
        return;
      }

      const data = await fetch(
        `${workflowsUrl}/${executionId}/log?taskName=${selectedTask}`,
      );
      const response = await data.text();
      setLog(
        `checking logs for ${selectedTask?.toUpperCase()} in execution: ${executionId}\n${response}`,
      );
    };

    const logInterval = setInterval(() => {
      updateWorkFlowLogs();
    }, 3000);

    updateWorkFlowLogs();

    return () => clearInterval(logInterval);
  }, [executionId, selectedTask, fetch, workflowsUrl, allTasks]);

  const showMoreWorkflowsToggle = useCallback(
    () => setShowMoreWorkflows(!showMoreWorkflows),
    [showMoreWorkflows],
  );

  return (
    <ParodosPage className={styles.container}>
      {isNew && (
        <Chip
          className={styles.badge}
          label="New application"
          color="secondary"
        />
      )}
      <Box mb={3}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link to="/onboarding/${projectId}/${projectId}/${executionId}/options/">
            Return to Assessment results
          </Link>
          <Typography>Workflow Detail</Typography>
        </Breadcrumbs>
      </Box>
      <ContentHeader title="Onboarding">
        <SupportButton title="Need help?">Lorem Ipsum</SupportButton>
      </ContentHeader>

      <Box className={styles.detailContainer}>
        <InfoCard className={styles.card}>
          <Typography paragraph>
            Please provide additional information related to your project.
          </Typography>
          <Typography paragraph>
            You are onboarding <strong>{project?.name || '...'}</strong>{' '}
            project, running workflow "{workflowName}" (execution ID:{' '}
            {executionId})
          </Typography>
          {allTasks.length > 0 ? (
            <WorkFlowStepper
              tasks={allTasks}
              setSelectedTask={setSelectedTask}
            />
          ) : (
            <Progress />
          )}
        </InfoCard>
        <Box>
          <Button
            onClick={showMoreWorkflowsToggle}
            className={styles.viewMoreButton}
          >
            {showMoreWorkflows ? <ChevronDown /> : <ChevronRight />}
            View More Workflows
          </Button>
          <Collapse in={showMoreWorkflows} timeout="auto" unmountOnExit>
            <h1>Fuck</h1>
          </Collapse>
        </Box>
        <div className={styles.viewerContainer}>
          {log !== '' && <WorkFlowLogViewer log={log} />}
        </div>
      </Box>
    </ParodosPage>
  );
}
