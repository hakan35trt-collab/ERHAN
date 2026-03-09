import { githubAuth, createGitHubEntity } from '@/lib/githubStore';

export const base44 = {
  auth: githubAuth,
  entities: {
    User: githubAuth,
    Visitor: createGitHubEntity('visitors'),
    Log: createGitHubEntity('logs'),
    Announcement: createGitHubEntity('announcements'),
    Message: createGitHubEntity('messages'),
    Notification: createGitHubEntity('notifications'),
    AuthorizationConfig: createGitHubEntity('authorizationConfigs'),
    FrequentVisitor: createGitHubEntity('frequentVisitors'),
    Staff: createGitHubEntity('staff'),
    ShiftConfiguration: createGitHubEntity('shiftConfigurations'),
    DirectoryConfig: createGitHubEntity('directoryConfigs'),
    Points: createGitHubEntity('points'),
    Note: createGitHubEntity('notes'),
    NoteRead: createGitHubEntity('noteReads'),
    VisitorAlert: createGitHubEntity('visitorAlerts'),
    VisitType: createGitHubEntity('visitTypes'),
    Badge: createGitHubEntity('badges'),
  },
  appLogs: { logUserInApp: () => Promise.resolve() },
};
