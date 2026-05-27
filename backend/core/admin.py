from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import DataSource, Organization, Site, User


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("username", "email", "organization", "is_staff")
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Tenant", {"fields": ("organization",)}),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ("Tenant", {"fields": ("organization",)}),
    )


@admin.register(Site)
class SiteAdmin(admin.ModelAdmin):
    list_display = ("external_code", "name", "country_iso", "organization")
    list_filter = ("organization",)


@admin.register(DataSource)
class DataSourceAdmin(admin.ModelAdmin):
    list_display = ("name", "source_type", "format_profile", "organization", "is_active")
    list_filter = ("source_type", "organization")
