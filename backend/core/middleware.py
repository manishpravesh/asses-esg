from rest_framework_simplejwt.authentication import JWTAuthentication

class TenantMiddleware:
    """Attach organization from authenticated user to the request."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.organization = None
        # Manually run JWT auth so request.user is populated before DRF views
        try:
            result = JWTAuthentication().authenticate(request)
            if result is not None:
                request.user, _ = result
        except Exception:
            pass

        user = getattr(request, "user", None)
        if user and user.is_authenticated and user.organization_id:
            request.organization = user.organization

        return self.get_response(request)