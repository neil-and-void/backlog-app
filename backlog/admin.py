from django.contrib import admin

from .models import Project, Column, Task

# Register your models here.
admin.site.register(Project)
admin.site.register(Column)
admin.site.register(Task)