// date format utils placeholder
export const formatDate = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString();
};

