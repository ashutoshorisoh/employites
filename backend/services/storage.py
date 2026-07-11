import boto3
from botocore.config import Config
from typing import Optional
from backend.core.config import settings

class R2StorageService:
    """
    Stateless service to interact with Cloudflare R2 storage via S3 API.
    """
    
    def _get_client(self):
        endpoint_url = settings.STORAGE_ENDPOINT_URL if settings.STORAGE_ENDPOINT_URL != "#reqd key" else settings.R2_ENDPOINT_URL
        access_key = settings.STORAGE_ACCESS_KEY_ID if settings.STORAGE_ACCESS_KEY_ID != "#reqd key" else settings.R2_ACCESS_KEY_ID
        secret_key = settings.STORAGE_SECRET_ACCESS_KEY if settings.STORAGE_SECRET_ACCESS_KEY != "#reqd key" else settings.R2_SECRET_ACCESS_KEY
        region_name = settings.STORAGE_REGION if settings.STORAGE_REGION else "us-east-1"
        
        # Guard against placeholder values
        if endpoint_url == "#reqd key" or access_key == "#reqd key" or secret_key == "#reqd key":
            # Return a dummy endpoint during testing if keys are placeholders
            endpoint_url = "https://placeholder-account-id.r2.cloudflarestorage.com"
            access_key = "dummy-access-key"
            secret_key = "dummy-secret-key"
            region_name = "us-east-1"

        return boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            config=Config(signature_version="s3v4"),
            region_name=region_name,
        )

    def generate_presigned_put_url(
        self, object_name: str, expiration: int = 3600, content_type: Optional[str] = None
    ) -> str:
        """
        Generates a presigned PUT URL for Cloudflare R2 or Supabase Storage uploads.
        Clients can use this URL to upload files directly.
        """
        s3_client = self._get_client()
        
        # Check bucket name configuration
        bucket_name = "skreener-uploads"
        if settings.STORAGE_BUCKET_NAME != "#reqd key":
            bucket_name = settings.STORAGE_BUCKET_NAME
        elif settings.R2_BUCKET_NAME != "#reqd key":
            bucket_name = settings.R2_BUCKET_NAME
        
        params = {
            "Bucket": bucket_name,
            "Key": object_name,
        }
        if content_type:
            params["ContentType"] = content_type

        try:
            url = s3_client.generate_presigned_url(
                ClientMethod="put_object",
                Params=params,
                ExpiresIn=expiration,
                HttpMethod="PUT",
            )
            return url
        except Exception as e:
            # If generating presigned URL fails due to dummy config, return mock URL for local development
            if settings.STORAGE_ACCESS_KEY_ID == "#reqd key" and settings.R2_ACCESS_KEY_ID == "#reqd key":
                return f"https://dev-storage.skreener.local/{bucket_name}/{object_name}?signature=mock_sign"
            raise e

    def delete_object(self, object_name: str) -> bool:
        """
        Deletes an object from the S3/Supabase Storage bucket.
        """
        s3_client = self._get_client()
        
        # Check bucket name configuration
        bucket_name = "skreener-uploads"
        if settings.STORAGE_BUCKET_NAME != "#reqd key":
            bucket_name = settings.STORAGE_BUCKET_NAME
        elif settings.R2_BUCKET_NAME != "#reqd key":
            bucket_name = settings.R2_BUCKET_NAME

        try:
            # Bypass deletion in mock mode
            if settings.STORAGE_ACCESS_KEY_ID == "#reqd key" and settings.R2_ACCESS_KEY_ID == "#reqd key":
                return True
                
            s3_client.delete_object(Bucket=bucket_name, Key=object_name)
            return True
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Error deleting storage object: {str(e)}")
            return False

    def download_object(self, object_name: str, local_path: str) -> bool:
        """
        Downloads an object from the S3/Supabase Storage bucket to a local file path.
        """
        s3_client = self._get_client()
        
        # Check bucket name configuration
        bucket_name = "skreener-uploads"
        if settings.STORAGE_BUCKET_NAME != "#reqd key":
            bucket_name = settings.STORAGE_BUCKET_NAME
        elif settings.R2_BUCKET_NAME != "#reqd key":
            bucket_name = settings.R2_BUCKET_NAME

        try:
            # Bypass download in mock mode if keys are placeholders
            if settings.STORAGE_ACCESS_KEY_ID == "#reqd key" and settings.R2_ACCESS_KEY_ID == "#reqd key":
                return False
                
            s3_client.download_file(bucket_name, object_name, local_path)
            return True
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Error downloading storage object {object_name}: {str(e)}")
            return False

    def generate_presigned_get_url(self, object_name: str, expiration: int = 3600) -> str:
        """
        Generates a presigned GET URL for viewing/downloading an object.
        """
        s3_client = self._get_client()
        bucket_name = "skreener-uploads"
        if settings.STORAGE_BUCKET_NAME != "#reqd key":
            bucket_name = settings.STORAGE_BUCKET_NAME
        elif settings.R2_BUCKET_NAME != "#reqd key":
            bucket_name = settings.R2_BUCKET_NAME

        try:
            url = s3_client.generate_presigned_url(
                ClientMethod="get_object",
                Params={
                    "Bucket": bucket_name,
                    "Key": object_name
                },
                ExpiresIn=expiration
            )
            return url
        except Exception:
            return f"https://dev-storage.skreener.local/{bucket_name}/{object_name}?signature=mock_get"

storage_service = R2StorageService()
