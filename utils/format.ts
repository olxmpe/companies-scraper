export const getInitials = (firstName: string, SecondName: string) => {
  return firstName.charAt(0).toUpperCase() + SecondName.charAt(0).toUpperCase();
};

export const normalizeString = (str: string) => {
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
};
