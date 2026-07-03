import client from './client';

export const listJobs = () => client.get('/jobs').then((res) => res.data);
export const getJob = (id) => client.get(`/jobs/${id}`).then((res) => res.data);
export const createJob = (payload) => client.post('/jobs', payload).then((res) => res.data);
export const updateJob = (id, payload) => client.put(`/jobs/${id}`, payload).then((res) => res.data);
export const deleteJob = (id) => client.delete(`/jobs/${id}`).then((res) => res.data);

export const downloadProposalPdf = async (jobId) => {
  const response = await client.get(`/jobs/${jobId}/proposal/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `proposal-${jobId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
