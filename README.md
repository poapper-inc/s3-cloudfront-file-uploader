# s3-cloudfront-file-uploader

![Badge](https://github.com/poapper-inc/s3-cloudfront-file-uploader/actions/workflows/node.yml/badge.svg)

## Description

File uploader using AWS S3 and AWS CloudFront.
Implemented in NestJS.

## Installation

```bash
$ npm install
```

## Prerequisites

A S3 bucket and a CloudFront distribution connected to the bucket is required.
It is recommended to keep all bucket files private and only grant access to the CloudFront distribution via an [Origin Access Identity](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html).
Also, an AWS access key pair with the neccessary permissions is required.

The relevant AWS information must be set in `.env`. See [Configuration](#configuration) for more details.

## Configuration

All configuration is done via `.env` (or system environment variables). The following configuration options must be provided:

| Key                   | Description                 |
| --------------------- | --------------------------- |
| AWS_ACCESS_KEY_ID     | AWS access key ID           |
| AWS_SECRET_ACCESS_KEY | AWS secret access key       |
| REGION                | AWS region                  |
| BUCKET_NAME           | S3 bucket name              |
| CF_DIST_URL           | CloudFront distribution URL |

An example is at [`.env.example`](/.env.example).

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Testing

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## API

### Upload a file

Uploads a single file.
The returned file name is a hash of the uploaded file contents.

```
POST /files
```

#### Parameters

| Name   | Parameter Type | Data Type | Description          |
| ------ | -------------- | --------- | -------------------- |
| `file` | form-data      | file      | File to be uploaded. |

#### Code Sample

```
curl -X POST http://localhost:3000/files \
  -H "Content-Type: multipart/form-data" \
  -F "file=@example.txt"
```

#### Response

```
Status: 201 Created
```

```json
{
  "filename": "uqGWBGj5noE1icvEz35x0Vq3sAw=.txt",
  "url": "https://xxxxxxxxxxx.cloudfront.net/uqGWBGj5noE1icvEz35x0Vq3sAw=.txt",
  "size": 740,
  "type": "text/plain"
}
```

### Get all files

Gets a list of all files.

```
GET /files
```

#### Parameters

None are necessary.

#### Code Sample

```
curl -X GET http://localhost:3000/files
```

#### Response

```
Status: 200 OK
```

```json
[
  {
    "filename": "1APuurjAXq_YO8DDaEG7Ej0AT7c=.txt",
    "url": "https://xxxxxxxxxxx.cloudfront.net/1APuurjAXq_YO8DDaEG7Ej0AT7c=.txt",
    "size": 24324,
    "lastModified": "2021-05-12T08:10:10.000Z"
  },
  {
    "filename": "uqGWBGj5noE1icvEz35x0Vq3sAw=.md",
    "url": "https://xxxxxxxxxxx.cloudfront.net/uqGWBGj5noE1icvEz35x0Vq3sAw=.txt",
    "size": 740,
    "lastModified": "2021-05-07T13:42:46.000Z"
  }
]
```

### Delete a file

Deletes a file specified by filename.

```
DELETE /files/:filename
```

#### Parameters

None are necessary.

#### Code Sample

```
curl -X DELETE http://localhost:3000/files/uqGWBGj5noE1icvEz35x0Vq3sAw=.txt
```

#### Response

```
Status: 200 OK
```
