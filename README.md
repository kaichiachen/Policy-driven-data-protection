# Policy-driven data protection

Data protection is more and more essential which can protect and backup data automatically in a cost-saving way. It is not safe to save only one copy of data. A good storage system can help us save our data safely according to Policy user given. For example, if user uploads data with policy RAID0, that means we save only one copy of data in a single machine, which has the risk of data loss. If user uploads data with policy RAID1, that means we save multiple copies of data on different machines.

However, the idea of that is hard to understand from scratch. With this chance, we would like to develop a very simple policy-driven data protection system to let everyone easily get familiar with the idea of that.

So, we would like to implement a policy-driven data protection system with the following

- Open source a very simple but clear policy-driven data protection system
- A back-end to make sure we won't lose data if any computer/host is down
- A back-end that users can upload and store objects regarding policies
- A front-end page to let user upload and watch their data

## Getting started

All the components of this project are distributed via Docker images on the GitHub Container Registry. We also utilize Docker Compose to unify containers in one app.

```bash
# Use Docker Compose to run the whole app
$ docker compose up

# Run the frontend
$ docker run -p 3000:3000 ghcr.io/kaichiachen/policy-driven-data-protection-frontend

# Run the backend
$ docker run -p 1039:1039 ghcr.io/kaichiachen/policy-driven-data-protection-backend
```

## Screenshots

![Screenshot of frontend (dark)](/.github/assets/screenshot-dark.png#gh-dark-mode-only)
![Screenshot of frontend (light)](/.github/assets/screenshot-light.png#gh-light-mode-only)

## Roadmap

- [ ] Actual backend implementation
- [ ] File storage servers
