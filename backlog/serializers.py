from rest_framework import serializers
from .models import Project, Column, Task

class ColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = Column
        fields = ('columnId','columnNumber','columnName','projectId') 

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('taskId','description', 'columnId')

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ('projectId', 'projectName', 'userId')