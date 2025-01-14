import React from 'react';
import { Content, HeaderTabs, Page } from '@backstage/core-components';
import { useLocation } from 'react-router-dom';
import StarIcon from '@material-ui/icons/Star';
import { makeStyles } from '@material-ui/core';
import { PageHeader } from './PageHeader';
import {
  AssessmentIcon,
  DeployIcon,
  NotificationIcon,
  ProjectsIcon,
  TrainingIcon,
  MetricsIcon,
} from './icons';
import { ProjectType, PropsFromComponent } from './types';
import { useBackendUrl } from './api';
import useAsync from 'react-use/lib/useAsync';
import { ErrorMessage } from './errors/ErrorMessage';
import { useNavigate } from 'react-router-dom';
import * as urls from '../urls';

export const pluginRoutePrefix = '/parodos';

export const navigationMap = [
  { label: 'Projects', routes: ['/project-overview'], icon: <ProjectsIcon /> },
  {
    label: 'Assessment',
    routes: ['/workflow', '/onboarding/'],
    icon: <AssessmentIcon />,
  },

  { label: 'Deploy', routes: ['/Deploy'], icon: <DeployIcon /> },
  {
    label: 'Notification',
    routes: ['/notification'],
    icon: <NotificationIcon />,
  },
  { label: 'Training', routes: ['/training'], icon: <TrainingIcon /> },
  { label: 'Metrics', routes: ['/metrics'], icon: <MetricsIcon /> },
];

const useStyles = makeStyles({
  highlightedTab: {
    position: 'absolute',
    top: '1rem',
    right: 0,
    color: '#F70D1A',
  },
});

export const TabLabel: React.FC<{
  icon?: React.ReactNode;
  label: string;
  highlighted?: boolean;
}> = ({ icon, label, highlighted }) => {
  const styles = useStyles();
  return (
    <>
      {icon}
      {highlighted && <StarIcon className={styles.highlightedTab} />}
      {label}
    </>
  );
};

// Unfortunately backstage do not export the props type for <Content />
type ContentProps = PropsFromComponent<typeof Content>;

type ParodosPageProps = ContentProps;

export const ParodosPage: React.FC<ParodosPageProps> = ({
  children,
  ...props
}) => {
  const [selectedTab, setSelectedTab] = React.useState(0);
  const { pathname } = useLocation();
  const [isProject, setIsProject] = React.useState(true);
  const backendUrl = useBackendUrl();
  const navigate = useNavigate();

  const { error } = useAsync(async () => {
    const response = await fetch(`${backendUrl}${urls.Projects}`);

    const receivedProjects = (await response.json()) as ProjectType[];
    setIsProject(receivedProjects.length > 0);
  }, [backendUrl]);

  React.useEffect(() => {
    let index = navigationMap.findIndex(({ routes }) =>
      routes.find(route => pathname.includes(route)),
    );
    index = index < 0 ? 0 : index;
    setSelectedTab(index);
  }, [pathname]);

  const onChangeTab = (index: number) => {
    setSelectedTab(index);
    navigate(`${pluginRoutePrefix}${navigationMap[index].routes[0]}`);
  };

  return (
    <Page themeId="tool">
      <PageHeader />
      <HeaderTabs
        selectedIndex={selectedTab}
        onChange={onChangeTab}
        tabs={navigationMap.map(({ label, icon }, index) => {
          const highlighted =
            selectedTab === 0 /* When on Projects tab only */ &&
            index === 1 /* for the Assessment tab only */ &&
            !isProject;

          return {
            id: index.toString(),
            label: (
              <TabLabel icon={icon} label={label} highlighted={highlighted} />
            ) as unknown as string /* Hack, since HeaderTabs accept string only. Contrary to Tabs coponent. */,

            // To consider: we can use Content here over react-router, the behavior would be smoother
          };
        })}
      />
      <Content {...props}>
        {error && <ErrorMessage error={error} />}
        {children}
      </Content>
    </Page>
  );
};
