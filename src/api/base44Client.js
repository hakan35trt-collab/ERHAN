import { localAuth, createEntity } from '@/lib/localStore';

export const base44 = {
  auth: localAuth,
  entities: {
    User: localAuth,
    Visitor: createEntity('visitors'),
    Log: createEntity('logs'),
    Announcement: createEntity('announcements'),
    Message: createEntity('messages'),
    Notification: createEntity('notifications'),
    AuthorizationConfig: createEntity('authorizationConfigs'),
    FrequentVisitor: createEntity('frequentVisitors'),
    Staff: createEntity('staff'),
    ShiftConfiguration: createEntity('shiftConfigurations'),
    DirectoryConfig: createEntity('directoryConfigs'),
    Points: createEntity('points'),
    Note: createEntity('notes'),
    NoteRead: createEntity('noteReads'),
    VisitorAlert: createEntity('visitorAlerts'),
    VisitType: createEntity('visitTypes'),
    Badge: createEntity('badges'),
  },
  appLogs: {
    logUserInApp: () => Promise.resolve(),
  },
};
