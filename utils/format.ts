export const getInitials = (firstName: string, SecondName: string) => {
  return firstName.charAt(0).toUpperCase() + SecondName.charAt(0).toUpperCase();
};
