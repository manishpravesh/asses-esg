from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import DataSource
from ingestion.models import IngestionBatch
from ingestion.serializers import IngestionBatchDetailSerializer, IngestionBatchSerializer
from ingestion.services import process_batch


class BatchUploadView(APIView):
    def post(self, request):
        org = request.organization
        if not org:
            return Response({"detail": "No organization assigned."}, status=status.HTTP_403_FORBIDDEN)

        source_type = request.data.get("source_type")
        upload = request.FILES.get("file")
        if not upload:
            return Response({"detail": "CSV file is required."}, status=status.HTTP_400_BAD_REQUEST)

        data_source = DataSource.objects.filter(organization=org, source_type=source_type, is_active=True).first()
        if not data_source:
            return Response({"detail": "Unknown or inactive source type for this organization."}, status=status.HTTP_400_BAD_REQUEST)

        batch = IngestionBatch.objects.create(
            organization=org,
            data_source=data_source,
            filename=upload.name,
            uploaded_by=request.user,
        )
        content = upload.read()
        process_batch(batch, content, request.user)
        batch.refresh_from_db()
        return Response(IngestionBatchDetailSerializer(batch).data, status=status.HTTP_201_CREATED)


class BatchListView(APIView):
    def get(self, request):
        org = request.organization
        qs = IngestionBatch.objects.filter(organization=org).select_related("data_source")
        return Response(IngestionBatchSerializer(qs[:50], many=True).data)


class BatchDetailView(APIView):
    def get(self, request, batch_id):
        org = request.organization
        batch = IngestionBatch.objects.filter(organization=org, id=batch_id).select_related("data_source").first()
        if not batch:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(IngestionBatchDetailSerializer(batch).data)
