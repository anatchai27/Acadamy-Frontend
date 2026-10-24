# File storage providers

Application services depend on `IFileStorageService`; provider SDKs live in the provider adapters. The default provider remains Aliyun OSS for existing deployments. Select Azure Blob using deployment environment variables (do not commit credentials):

- `FileStorage__Provider=AzureBlob`
- `AzureBlob__ConnectionString=<secret from deployment configuration>`
- `AzureBlob__PublicContainerName=<public container>`
- `AzureBlob__PrivateContainerName=<private container>`
- `AzureBlob__PublicBaseUrl=<optional CDN/container base URL>`

The public container must allow public reads for uploaded images and files whose URLs are stored in existing database fields. Keep the private container private; signed downloads use a read-only SAS URL. The connection string must use shared-key credentials for SAS generation.

To retain the current provider, use `FileStorage__Provider=AliyunOss` (or omit it) and keep the existing `ThaiDataCloud` configuration.

## Provider cutover checklist

1. Create both Azure containers and configure public-read access only on the public container.
2. Copy private course-material objects from OSS to the Azure private container with their exact existing object keys. Course-material rows store keys, not provider names.
3. Deploy Azure configuration and test public upload/URL reads, private upload, signed download, and deletion before turning down OSS.
4. Existing public-file URLs are persisted as absolute URLs in several records. They continue to point to OSS after the switch. Keep OSS available until those objects are copied and the stored URLs are migrated or otherwise served from their old locations.

Changing `FileStorage__Provider` switches new operations; it does not copy objects or rewrite existing database URLs by itself.