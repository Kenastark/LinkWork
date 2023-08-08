from django.db import models

class JobCategory(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField()
    # Other fields and methods related to job categories

class JobPosting(models.Model):
    title = models.CharField(max_length=150)
    description = models.TextField()
    job_category = models.ForeignKey(JobCategory, on_delete=models.CASCADE)
    organization = models.ForeignKey('Organization', on_delete=models.CASCADE, related_name='job_postings')
    location = models.CharField(max_length=100)
    requirements = models.TextField()
    responsibilities = models.TextField()
    salary_range = models.CharField(max_length=50)
    application_deadline = models.DateField()
    # Other fields and methods related to job postings

class Organization(models.Model):
    name = models.CharField(max_length=100)
    industry = models.CharField(max_length=50)
    location = models.CharField(max_length=100)
    description = models.TextField()
    logo = models.ImageField(upload_to='organization_logos/')
    website = models.URLField()
    # Other fields and methods related to organizations

    jobposting_set = models.ManyToManyField(JobPosting, related_name='organizations')

