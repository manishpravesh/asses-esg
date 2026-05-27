from django.contrib import admin

from .models import ActivityRecord, AuditEvent

admin.site.register(ActivityRecord)
admin.site.register(AuditEvent)
