from django.core.management.base import BaseCommand

from core.models import DataSource, Organization, Site, User


class Command(BaseCommand):
    help = "Seed demo organization, sites, data sources, and analyst user"

    def handle(self, *args, **options):
        org, _ = Organization.objects.get_or_create(
            slug="demo-client",
            defaults={"name": "Demo Enterprise Client"},
        )

        sites = [
            ("1000", "HQ — Frankfurt", "DE"),
            ("DE01", "Plant Düsseldorf", "DE"),
            ("US01", "Plant Austin", "US"),
            ("3456222222-9", "PG&E Account — SF HQ", "US"),
        ]
        for code, name, country in sites:
            Site.objects.get_or_create(
                organization=org,
                external_code=code,
                defaults={"name": name, "country_iso": country},
            )

        sources = [
            ("SAP Procurement (ME2N)", DataSource.SourceType.SAP_PROCUREMENT, DataSource.FormatProfile.ME2N),
            ("SAP Fuel (MB51)", DataSource.SourceType.SAP_FUEL, DataSource.FormatProfile.MB51),
            ("Utility Portal CSV", DataSource.SourceType.UTILITY, DataSource.FormatProfile.UTILITY_PORTAL),
            ("Corporate Travel (Concur)", DataSource.SourceType.TRAVEL, DataSource.FormatProfile.CONCUR),
        ]
        for name, stype, profile in sources:
            DataSource.objects.get_or_create(
                organization=org,
                source_type=stype,
                defaults={"name": name, "format_profile": profile},
            )

        analyst, created = User.objects.get_or_create(
            username="analyst",
            defaults={
                "email": "analyst@demo.client.com",
                "first_name": "Jordan",
                "last_name": "Analyst",
                "organization": org,
            },
        )
        if created:
            analyst.set_password("demo1234")
            analyst.save()
        else:
            analyst.organization = org
            analyst.save()

        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@demo.client.com",
                "is_staff": True,
                "is_superuser": True,
                "organization": org,
            },
        )
        if created:
            admin_user.set_password("admin1234")
            admin_user.save()

        self.stdout.write(self.style.SUCCESS("Demo data seeded."))
        self.stdout.write("Analyst: analyst@demo.client.com / demo1234")
        self.stdout.write("Admin: admin@demo.client.com / admin1234")
