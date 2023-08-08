from django.db import models
from users.models import CustomUser  # Import the User model from the correct location

class Application(models.Model):
    APPLICATION_STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Reviewed', 'Reviewed'),
        ('Rejected', 'Rejected'),
        ('Selected', 'Selected'),
    ]

    job_seeker = models.ForeignKey(CustomUser, on_delete=models.CASCADE)  # Use the imported User model
    job_posting = models.ForeignKey('jobs.JobPosting', on_delete=models.CASCADE)  # Adjust the path to JobPosting
    application_date = models.DateTimeField(auto_now_add=True)
    cover_letter = models.TextField()
    status = models.CharField(max_length=20, choices=APPLICATION_STATUS_CHOICES, default='Pending')

    def __str__(self):
        return f"{self.job_seeker.username} - {self.job_posting.title}"

