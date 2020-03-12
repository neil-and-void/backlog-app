from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Project(models.Model):
    projectId = models.AutoField(primary_key=True)
    projectName = models.CharField(max_length=50)
    userId = models.ForeignKey(User, on_delete=models.CASCADE)

class Column(models.Model):
    columnId = models.AutoField(primary_key=True)
    columnNumber = models.IntegerField()
    columnName = models.CharField(max_length=50)
    projectId = models.ForeignKey(Project, on_delete=models.CASCADE)

class Task(models.Model):
    taskId = models.AutoField(primary_key=True)
    description = models.CharField(max_length=150)
    columnId = models.ForeignKey(Column, on_delete=models.CASCADE)
