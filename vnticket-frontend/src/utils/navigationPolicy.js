export const getRoleNavigation = (user) => {
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isAuthenticated = Boolean(user);

  return {
    isAdmin,
    showMyTickets: isAuthenticated && !isAdmin,
    showOrganizer: !isAdmin,
    primaryDestination: isAdmin ? '/admin' : '/history',
  };
};
