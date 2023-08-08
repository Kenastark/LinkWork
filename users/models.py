from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
class CustomUser(AbstractUser):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    address = models.TextField(blank=True)
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    skills = models.TextField(blank=True)
    education = models.TextField(blank=True)
    # Other fields like certifications, work history, etc.

    def __str__(self):
        return self.username
     # Add related_name to avoid field clash
    groups = models.ManyToManyField(Group, related_name='custom_user_set')
    user_permissions = models.ManyToManyField(Permission, related_name='custom_user_set')
    # You can add methods here for custom user actions or computations.
    
class UserProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    linkedin_profile = models.URLField(blank=True)
    twitter_profile = models.URLField(blank=True)
    # Other profile-related fields
    
    def __str__(self):
        return self.user.username

class CustomGroup(Group):
    description = models.TextField()

    def __str__(self):
        return self.name
    
class CustomPermission(Permission):
    description = models.TextField()

    def __str__(self):
        return self.name



