import React from 'react';
import { AssessmentIcon, NotificationIcon, ProjectsIcon } from '../icons';

export const pluginRoutePrefix = '/parodos';

export const navigationMap = [
  { label: 'Projects', routes: ['/project-overview'], icon: <ProjectsIcon /> },
  { label: 'Workflow', routes: ['/workflow'], icon: <AssessmentIcon />},
  {
    label: 'Assessment',
    routes: ['/onboarding/'],
    icon: <AssessmentIcon />,
  },

  {
    label: 'Notification',
    routes: ['/notification'],
    icon: <NotificationIcon />,
  },
];
