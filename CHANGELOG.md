# 1.0.0 (2026-02-02)


### Features

* **template:** initialize payload CMS starter template ([0e53d50](https://github.com/m6o4solutions/payload-template/commit/0e53d50cde2c8a06bc50b22ca6342018cc5c1733))

## [1.28.1](https://github.com/m6o4solutions/payload-template-project/compare/v1.28.0...v1.28.1) (2025-12-25)

### Bug Fixes

- update MongoDB connection URIs for local development
  ([f2eeffc](https://github.com/m6o4solutions/payload-template-project/commit/f2eeffc3728fbc9f44bb02274f39dfa9d5e0bf9e))

# [1.28.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.27.0...v1.28.0) (2025-12-25)

### Features

- update MongoDB setup and database URIs for Docker compatibility
  ([2d718c9](https://github.com/m6o4solutions/payload-template-project/commit/2d718c9290262c888f12097fffbc699d282f9dc4))

# [1.27.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.26.1...v1.27.0) (2025-12-25)

### Features

- add dynamic export for force-dynamic rendering in page component
  ([33e6c7c](https://github.com/m6o4solutions/payload-template-project/commit/33e6c7cbec98ec4136c38371c8e52575d71798c4))

## [1.26.1](https://github.com/m6o4solutions/payload-template-project/compare/v1.26.0...v1.26.1) (2025-12-25)

### Bug Fixes

- add guard clause to skip database query in CI/Docker builds
  ([9cc0ee4](https://github.com/m6o4solutions/payload-template-project/commit/9cc0ee4be7c8d9f622182e4e4938180d625230f7))

# [1.26.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.25.0...v1.26.0) (2025-12-23)

### Features

- add Docker Buildx setup and caching to GHCR workflow
  ([cebbd7b](https://github.com/m6o4solutions/payload-template-project/commit/cebbd7b599f1d005c0d7ef8a1aaf65de11e1674b))

# [1.25.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.24.0...v1.25.0) (2025-12-22)

### Features

- add NEXT_PUBLIC_CLARITY_ID as build-time environment variable
  ([bfe70bc](https://github.com/m6o4solutions/payload-template-project/commit/bfe70bcb4b89387550ca57f3b9f7d7dbe910feee))

# [1.24.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.23.0...v1.24.0) (2025-12-22)

### Features

- enhance ClarityTracker for improved debugging in development mode
  ([7598402](https://github.com/m6o4solutions/payload-template-project/commit/75984023fcf3201a753650cac295994351b42277))

# [1.23.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.22.0...v1.23.0) (2025-12-22)

### Features

- add ClarityTrackerDev for enhanced user behavior tracking in dev
  ([03f1514](https://github.com/m6o4solutions/payload-template-project/commit/03f1514b7c72c1bbb04836ba098a86304bfa4240))

# [1.22.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.21.1...v1.22.0) (2025-12-22)

### Features

- add CollectionCards to importMap for UI components
  ([0739387](https://github.com/m6o4solutions/payload-template-project/commit/07393877a1641ad19da353f098c23538e2513d57))

## [1.21.1](https://github.com/m6o4solutions/payload-template-project/compare/v1.21.0...v1.21.1) (2025-12-22)

### Bug Fixes

- update limit to 0 for fetching published pages in static params
  ([5a8a878](https://github.com/m6o4solutions/payload-template-project/commit/5a8a878db5bd9b299ec1d2334bebb22eca318d79))

# [1.21.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.20.0...v1.21.0) (2025-12-20)

### Features

- add initial docker-compose configuration for payload-template service
  ([8d2089b](https://github.com/m6o4solutions/payload-template-project/commit/8d2089ba7a17bbd618d67a69f74ba722812bd462))

# [1.20.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.19.6...v1.20.0) (2025-12-19)

### Features

- add ClarityTracker component and integrate Microsoft Clarity
  ([1917c0b](https://github.com/m6o4solutions/payload-template-project/commit/1917c0b4a49d202af1eb82b31c606ae51a7083a0))
- add reCAPTCHA secret key and Microsoft Clarity project ID
  ([154eda7](https://github.com/m6o4solutions/payload-template-project/commit/154eda791febe1d5893f20713dcccfe4bdcd3539))

## [1.19.6](https://github.com/m6o4solutions/payload-template-project/compare/v1.19.5...v1.19.6) (2025-12-19)

### Bug Fixes

- change cut-off time to 0 in cleanup workflow
  ([1418e78](https://github.com/m6o4solutions/payload-template-project/commit/1418e78ca49e4647b83b6948b69d2e3bbac33219))

## [1.19.5](https://github.com/m6o4solutions/payload-template-project/compare/v1.19.4...v1.19.5) (2025-12-19)

### Bug Fixes

- update container-retention-policy action to v3.0.1 and clean config
  ([9ca5903](https://github.com/m6o4solutions/payload-template-project/commit/9ca5903b9516d8ee7588daa52895fe5815c935af))

## [1.19.4](https://github.com/m6o4solutions/payload-template-project/compare/v1.19.3...v1.19.4) (2025-12-18)

### Bug Fixes

- update cut-off time for old Docker images to one minute ago UTC
  ([40891aa](https://github.com/m6o4solutions/payload-template-project/commit/40891aa48409506c90da408f40dc7813f60ae6eb))

## [1.19.3](https://github.com/m6o4solutions/payload-template-project/compare/v1.19.2...v1.19.3) (2025-12-18)

### Bug Fixes

- modify ghcr cleanup workflow configuration
  ([4f2a221](https://github.com/m6o4solutions/payload-template-project/commit/4f2a2216344a462579712b2f79d4186f10349ae6))

## [1.19.2](https://github.com/m6o4solutions/payload-template-project/compare/v1.19.1...v1.19.2) (2025-12-18)

### Bug Fixes

- add environment variable for registry in cleanup workflow
  ([d8482d1](https://github.com/m6o4solutions/payload-template-project/commit/d8482d18f444ff0825a1c9215dfda0f560f3f427))

## [1.19.1](https://github.com/m6o4solutions/payload-template-project/compare/v1.19.0...v1.19.1) (2025-12-18)

### Bug Fixes

- correct parameter name for Docker image retention policy
  ([eb3b59e](https://github.com/m6o4solutions/payload-template-project/commit/eb3b59e504c5fe7b398f857e9064da21d7a55c9b))
- update container-retention-policy action to version 3.0.1
  ([ac6dfc3](https://github.com/m6o4solutions/payload-template-project/commit/ac6dfc3cabb8f48f4710e5c6278bc17cbaaf64ec))

# [1.19.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.18.0...v1.19.0) (2025-12-18)

### Features

- create and update workflows for consistency and improved functionality
  ([ef64e08](https://github.com/m6o4solutions/payload-template-project/commit/ef64e086649668e4ecf160caba4c89b6d0539ac3))

# [1.18.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.17.0...v1.18.0) (2025-12-18)

### Features

- derive image name dynamically for Docker GHCR workflow
  ([5c68b59](https://github.com/m6o4solutions/payload-template-project/commit/5c68b59889245f4a24611a145927de036a4f4831))

# [1.17.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.16.0...v1.17.0) (2025-12-17)

### Features

- add build-time environment variables for database URIs
  ([06bf4b3](https://github.com/m6o4solutions/payload-template-project/commit/06bf4b328a6e118b439e41754049c65e7d8c95c9))

# [1.16.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.15.0...v1.16.0) (2025-12-17)

### Features

- add PAYLOAD_SECRET as a build-time environment variable
  ([0ed2903](https://github.com/m6o4solutions/payload-template-project/commit/0ed2903a9b77b4b87b007f17873e198680361cd9))

# [1.15.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.14.0...v1.15.0) (2025-12-17)

### Features

- add build-time environment variable for NEXT_PUBLIC_SERVER_URL
  ([70538b5](https://github.com/m6o4solutions/payload-template-project/commit/70538b57065d435d433082088ab83042bf9a774e))
- implement GitHub Actions for building and pushing Docker images
  ([be55f87](https://github.com/m6o4solutions/payload-template-project/commit/be55f8745142131b4e0f22426b90335fa8299468))

# [1.14.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.13.7...v1.14.0) (2025-12-16)

### Features

- add Dockerfile and .dockerignore for containerization setup
  ([f0e7b5f](https://github.com/m6o4solutions/payload-template-project/commit/f0e7b5f0c266d91cde5c3dceafd8ae0c7a8ea1a7))
- add GitHub Actions workflow to publish Docker image to GHCR
  ([334ffd7](https://github.com/m6o4solutions/payload-template-project/commit/334ffd7545e2ff282a5dd0a42a6c1ca3750cb096))

## [1.13.7](https://github.com/m6o4solutions/payload-template-project/compare/v1.13.6...v1.13.7) (2025-12-02)

### Bug Fixes

- enhance db config with mock methods for Next.js
  ([709a64b](https://github.com/m6o4solutions/payload-template-project/commit/709a64b42130c0fcedec853262e3a45df243f82f))

## [1.13.6](https://github.com/m6o4solutions/payload-template-project/compare/v1.13.5...v1.13.6) (2025-12-02)

### Bug Fixes

- add dummy methods to MongoDB adapter
  ([ad321e4](https://github.com/m6o4solutions/payload-template-project/commit/ad321e47e32b7d0b4bdb6c06f8d1d5e3863ad77f))

## [1.13.5](https://github.com/m6o4solutions/payload-template-project/compare/v1.13.4...v1.13.5) (2025-12-02)

### Bug Fixes

- add dummy query methods to payload.config.ts
  ([c9d9728](https://github.com/m6o4solutions/payload-template-project/commit/c9d97286b1ff0c7672e70b41486ba874cf35602e))

## [1.13.4](https://github.com/m6o4solutions/payload-template-project/compare/v1.13.3...v1.13.4) (2025-12-02)

### Bug Fixes

- rename build stage to base in Dockerfile
  ([2437d46](https://github.com/m6o4solutions/payload-template-project/commit/2437d469b3cfb9f9b34f7cbc9f45bb18e1f98142))

## [1.13.3](https://github.com/m6o4solutions/payload-template-project/compare/v1.13.2...v1.13.3) (2025-12-02)

### Bug Fixes

- change base image to Node.js 22-alpine
  ([9d5aff0](https://github.com/m6o4solutions/payload-template-project/commit/9d5aff0e1efe8ae2a0f178117afe0e32418f3db4))

## [1.13.2](https://github.com/m6o4solutions/payload-template-project/compare/v1.13.1...v1.13.2) (2025-12-02)

### Bug Fixes

- Implement mock database adapter for Docker builds
  ([50ee60c](https://github.com/m6o4solutions/payload-template-project/commit/50ee60c63473ab081b0a5e6425870650fd11c663))

## [1.13.1](https://github.com/m6o4solutions/payload-template-project/compare/v1.13.0...v1.13.1) (2025-11-20)

### Bug Fixes

- update payload meta icon filename in environment configuration
  ([6dc890c](https://github.com/m6o4solutions/payload-template-project/commit/6dc890c1a66c7622f3bf01dee9648ed6114ac9fe))

# [1.13.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.12.0...v1.13.0) (2025-11-17)

### Features

- update environment variables for database and storage configurations
  ([2c363b7](https://github.com/m6o4solutions/payload-template-project/commit/2c363b7400645ee13a85ca1130e810d9893727d7))

# [1.12.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.11.0...v1.12.0) (2025-11-14)

### Bug Fixes

- revalidateTag issue for page, posts and redirects
  ([aefb42b](https://github.com/m6o4solutions/payload-template-project/commit/aefb42b283fb20f0b49c8819a05b4ac892153795))

### Features

- implement sitemaps to payload
  ([07f06ad](https://github.com/m6o4solutions/payload-template-project/commit/07f06ada5e04053904fcb29ff8bb6074b9f6e49f))

# [1.11.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.10.0...v1.11.0) (2025-11-13)

### Features

- implement payload cms forms
  ([db684dd](https://github.com/m6o4solutions/payload-template-project/commit/db684dd23704b631fbcf28246d4a311b933b313a))

# [1.10.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.9.0...v1.10.0) (2025-10-17)

### Bug Fixes

- rename application folder form frontend to web
  ([ed7a7a0](https://github.com/m6o4solutions/payload-template-project/commit/ed7a7a05aebfc6efe2268219bf6cf7bbc587f8de))

### Features

- change default font to Inter
  ([bfd8e69](https://github.com/m6o4solutions/payload-template-project/commit/bfd8e69bf6697c3f91c189cd30083cb9d27edecf))
- install shadcn ui components
  ([e222259](https://github.com/m6o4solutions/payload-template-project/commit/e2222598f80afeab616c909b5f080c1c59723c7e))

# [1.9.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.8.0...v1.9.0) (2025-10-10)

### Features

- Wired up the mechanics to work with Payload.
  ([34ea637](https://github.com/m6o4solutions/payload-template-project/commit/34ea6376454ea516a429e10ccf19eb7be1e8572a))

# [1.8.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.7.0...v1.8.0) (2025-10-10)

### Features

- White label Payload CMS with S3 logo
  ([93697d7](https://github.com/m6o4solutions/payload-template-project/commit/93697d701ef71492a648c3b3fd5ca33d113b2493))

# [1.7.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.6.0...v1.7.0) (2025-10-08)

### Features

- Add CRON_SECRET to example environment
  ([9032308](https://github.com/m6o4solutions/payload-template-project/commit/9032308e7070223f566601320d84cb9a83bf1088))

# [1.6.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.5.0...v1.6.0) (2025-10-08)

### Features

- Implement pages, posts, and block editor
  ([60d0830](https://github.com/m6o4solutions/payload-template-project/commit/60d0830dbb331f48737e7e8a62d09e157f0b7589))
- Replace name field with separate first and last name fields
  ([89bddb0](https://github.com/m6o4solutions/payload-template-project/commit/89bddb08db1cf320c6bf222c0dbb6cb03a2c67b7))

# [1.5.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.4.0...v1.5.0) (2025-10-07)

### Features

- add accordion, card, and button components
  ([74d1ba1](https://github.com/m6o4solutions/payload-template-project/commit/74d1ba1ee12c46e64b2b5b83494eb7adb98e0980))
- add comprehensive set of utility functions
  ([776bd07](https://github.com/m6o4solutions/payload-template-project/commit/776bd073d5b83645fd6a8b6fce9ed77fbb15ad21))
- add live preview and media components
  ([5346e71](https://github.com/m6o4solutions/payload-template-project/commit/5346e7152ddb8b5782ce54c88bfcf84e4f737a49))
- Add reusable link and enhanced slug fields
  ([a1b3ffe](https://github.com/m6o4solutions/payload-template-project/commit/a1b3ffef6ce8c250f06d8db561f9410d94fab7e9))

# [1.4.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.3.0...v1.4.0) (2025-10-05)

### Features

- implement header/footer globals and component refactor
  ([9466fc2](https://github.com/m6o4solutions/payload-template-project/commit/9466fc2172cb2ec3f61c436293d57678310fbb64))

# [1.3.0](https://github.com/m6o4solutions/payload-template-project/compare/v1.2.2...v1.3.0) (2025-10-03)

### Features

- add s3 storage adapter and update dependencies
  ([b484e73](https://github.com/m6o4solutions/payload-template-project/commit/b484e736b686957266d5adb24bb45e54a0283f4d))
- implement live preview with next.js draft mode
  ([99df796](https://github.com/m6o4solutions/payload-template-project/commit/99df796d73afd5a53cf6f3c59536a7a2ace53666))

# [1.3.0-dev.1](https://github.com/m6o4solutions/payload-basic-template-project/compare/v1.2.0...v1.3.0-dev.1) (2025-09-25)

### Bug Fixes

- allow images from specific external paths and block all others
  ([#8](https://github.com/m6o4solutions/payload-basic-template-project/issues/8))
  ([7ffc7f5](https://github.com/m6o4solutions/payload-basic-template-project/commit/7ffc7f5407bc1bc20519ffac8d0fbe19ee4cdcfe))
- allow images from specific external paths and block all others
  ([#8](https://github.com/m6o4solutions/payload-basic-template-project/issues/8))
  ([7ffc7f5](https://github.com/m6o4solutions/payload-basic-template-project/commit/7ffc7f5407bc1bc20519ffac8d0fbe19ee4cdcfe))

### Features

- create categories collection
  ([fd40071](https://github.com/m6o4solutions/payload-basic-template-project/commit/fd4007129cab680feab99d468770151ef38abc55))

## [1.2.2](https://github.com/m6o4solutions/payload-basic-template-project/compare/v1.2.1...v1.2.2) (2025-09-25)

### Bug Fixes

- match domain to what Next.js sees in next.config.mjs
  ([#10](https://github.com/m6o4solutions/payload-basic-template-project/issues/10))
  ([b2aa32f](https://github.com/m6o4solutions/payload-basic-template-project/commit/b2aa32f338c421c0723e35c01c98f261f36bdb34))

# [1.2.0-rc.1](https://github.com/m6o4solutions/payload-basic-template-project/compare/v1.1.0...v1.2.0-rc.1) (2025-09-25)

### Bug Fixes

- allow images from specific external paths and block all others
  ([2bc803f](https://github.com/m6o4solutions/payload-basic-template-project/commit/2bc803f7f7ef42d49f6f0c956e80bf4d8892fbc6))

### Features

- add access control functions for user authentication
  ([70e29c6](https://github.com/m6o4solutions/payload-basic-template-project/commit/70e29c67d8819036083a7a4fbc286f71757ca8cf))
- add name and photo fields to User interface and schema
  ([ca1875c](https://github.com/m6o4solutions/payload-basic-template-project/commit/ca1875c85137a981b5922f65a6213b8c828156dc))
- enhance media schema with caption and size options
  ([b1d6305](https://github.com/m6o4solutions/payload-basic-template-project/commit/b1d6305c8c7107f1f28cbc9c12dfa64f472fc222))
- integrate Uploadthing storage plugin and enhance media schema
  ([6508380](https://github.com/m6o4solutions/payload-basic-template-project/commit/6508380744f9fd20639f2c956c4b821499b6fc43))
- add access control functions for user authentication
  ([70e29c6](https://github.com/m6o4solutions/payload-basic-template-project/commit/70e29c67d8819036083a7a4fbc286f71757ca8cf))
- add name and photo fields to User interface and schema
  ([ca1875c](https://github.com/m6o4solutions/payload-basic-template-project/commit/ca1875c85137a981b5922f65a6213b8c828156dc))
- enhance media schema with caption and size options
  ([b1d6305](https://github.com/m6o4solutions/payload-basic-template-project/commit/b1d6305c8c7107f1f28cbc9c12dfa64f472fc222))
- integrate Uploadthing storage plugin and enhance media schema
  ([6508380](https://github.com/m6o4solutions/payload-basic-template-project/commit/6508380744f9fd20639f2c956c4b821499b6fc43))

# [1.1.0-rc.1](https://github.com/m6o4solutions/payload-basic-template-project/compare/v1.0.0...v1.1.0-rc.1) (2025-09-25)

### Features

- add access control functions for user authentication
  ([70e29c6](https://github.com/m6o4solutions/payload-basic-template-project/commit/70e29c67d8819036083a7a4fbc286f71757ca8cf))
- add name and photo fields to User interface and schema
  ([ca1875c](https://github.com/m6o4solutions/payload-basic-template-project/commit/ca1875c85137a981b5922f65a6213b8c828156dc))
- enhance media schema with caption and size options
  ([b1d6305](https://github.com/m6o4solutions/payload-basic-template-project/commit/b1d6305c8c7107f1f28cbc9c12dfa64f472fc222))
- enhance template with new components and improve layout structure
  ([#5](https://github.com/m6o4solutions/payload-basic-template-project/issues/5))
  ([9716d29](https://github.com/m6o4solutions/payload-basic-template-project/commit/9716d2958144dc31465851cfd92f6634cd923c17))
- integrate Uploadthing storage plugin and enhance media schema
  ([6508380](https://github.com/m6o4solutions/payload-basic-template-project/commit/6508380744f9fd20639f2c956c4b821499b6fc43))
- add email resend configuration and import in payload config
  ([a1855a2](https://github.com/m6o4solutions/payload-basic-template-project/commit/a1855a232cc90acbbd0b0b397829de8e2e3e9d70))
- enhance template with new components and improve layout structure
  ([5712be2](https://github.com/m6o4solutions/payload-basic-template-project/commit/5712be23a0e9591d1a4428c1fc59a089946598ed))
- implement lexical editor with rich text features in payload config
  ([239b31f](https://github.com/m6o4solutions/payload-basic-template-project/commit/239b31f63aa761ba466712db53548a43f16bf5d0))
- refactor layout and add theme provider
  ([928d21c](https://github.com/m6o4solutions/payload-basic-template-project/commit/928d21ccd001a799b9f6478a0e0ae8b254c2c9a7))
- restructure collections and update import map for new schema
  ([4952cbd](https://github.com/m6o4solutions/payload-basic-template-project/commit/4952cbdddb0a224ca6634f4e3e59dbff4c6734e5))
- update layout to use Geist font and add favicon
  ([f03aa5b](https://github.com/m6o4solutions/payload-basic-template-project/commit/f03aa5b0e9add9e35108a8e33cba5dd86601aac6))

# 1.0.0 (2025-09-25)

### Features

- add GitHub Actions workflow for building and pushing Docker image
  ([#1](https://github.com/m6o4solutions/payload-basic-template-project/issues/1))
  ([cdbbfa9](https://github.com/m6o4solutions/payload-basic-template-project/commit/cdbbfa937a898a6b5f54798e355eadf538832d08))
- initial commit
  ([aa75abc](https://github.com/m6o4solutions/payload-basic-template-project/commit/aa75abce8d3d19bd51f6c958caa0c32a3c608039))
