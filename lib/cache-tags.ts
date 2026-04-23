export const TAGS = {
  properties: "portal-properties",
  property: (id: string) => `portal-property-${id}`,
  posts: "portal-posts",
  post: (id: string) => `portal-post-${id}`,
  team: "portal-team",
  teamMember: (id: string) => `portal-team-member-${id}`,
  submissions: "portal-submissions",
  userDashboard: (userId: string) => `portal-user-dashboard-${userId}`,
} as const;
