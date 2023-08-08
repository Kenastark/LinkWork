from django.db import models
from users.models import CustomUser
from organizations.models import Organization
class Recruiter(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    company = models.ForeignKey(Organization, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    # Other fields and methods related to recruiters

# Create your models here.
