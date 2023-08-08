from django.db import models

class JobCategory(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField()

    def __str__(self):
        return self.name

class JobPosting(models.Model):
    STATUS_CHOICES = [
        ('Open', 'Open'),
        ('Closed', 'Closed'),
    ]

    title = models.CharField(max_length=150)
    description = models.TextField()
    job_category = models.ForeignKey(JobCategory, on_delete=models.PROTECT)
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name='job_posting')
    location = models.CharField(max_length=100)
    requirements = models.TextField()
    responsibilities = models.TextField()
    salary_range = models.CharField(max_length=50)
    application_deadline = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Open')
    featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
    
class JobApplication(models.Model):
    APPLICATION_STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Reviewed', 'Reviewed'),
        ('Rejected', 'Rejected'),
        ('Selected', 'Selected'),
    ]

    job_seeker = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE)
    job_posting = models.ForeignKey(JobPosting, on_delete=models.CASCADE)
    application_date = models.DateTimeField(auto_now_add=True)
    cover_letter = models.TextField()
    status = models.CharField(max_length=20, choices=APPLICATION_STATUS_CHOICES, default='Pending')

    def __str__(self):
        return f"{self.job_seeker.username} - {self.job_posting.title}"

# Create your models here.
