// Placeholder API layer - employees
export const fetchEmployees = async () => {
  console.log('fetchEmployees called');
  return Promise.resolve({ data: [], message: 'employees placeholder' });
};

export const fetchEmployeeById = async (id) => {
  console.log('fetchEmployeeById called', id);
  return Promise.resolve({ data: { id }, message: 'employee placeholder' });
};

