## Policy-driven data protection

Data protection is more and more essential which can protect and backup data automatically in a cost-saving way. It is not safe to save only one copy of data. A good storage system can help us save our data safely according to Policy user given. For example, if user uploads data with policy RAID0, that means we save only one copy of data in a single machine, which has the risk of data loss. If user uploads data with policy RAID1, that means we save multiple copies of data on different machines.

However, the idea of that is hard to understand from scratch. With this chance, we would like to develop a very simple policy-driven data protection system to let everyone easily get familiar with the idea of that.

So, we would like to implement a policy-driven data protection system with the following

- Open source a very simple but clear policy-driven data protection system
- A back-end to make sure we won't lose data if any computer/host is down
- A back-end that users can upload and store objects regarding policies
- A front-end page to let user upload and watch their data
