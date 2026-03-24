#!/usr/bin/env python
"""
Script to load fixture data into the database.
Usage: python load_fixtures.py
"""

import os
import sys
import json
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from Users.models import Faculty, Major, Role

FIXTURE_DIR = os.path.join(os.path.dirname(__file__), 'Fixture')


def load_faculties():
    """Load faculty data from faculty.json"""
    filepath = os.path.join(FIXTURE_DIR, 'faculty.json')
    
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return 0
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    count = 0
    for item in data:
        faculty, created = Faculty.objects.update_or_create(
            id=item['id'],
            defaults={
                'code': item['code'],
                'name': item['name'],
            }
        )
        if created:
            count += 1
            print(f"  Created Faculty: {faculty.code} - {faculty.name}")
        else:
            print(f"  Updated Faculty: {faculty.code} - {faculty.name}")
    
    return count


def load_majors():
    """Load major data from major.json"""
    filepath = os.path.join(FIXTURE_DIR, 'major.json')
    
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return 0
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    count = 0
    for item in data:
        try:
            faculty = Faculty.objects.get(id=item['faculty_id'])
            major, created = Major.objects.update_or_create(
                name=item['name'],
                defaults={
                    'faculty': faculty,
                }
            )
            if created:
                count += 1
                print(f"  Created Major: {major.name} ({faculty.code})")
            else:
                print(f"  Updated Major: {major.name} ({faculty.code})")
        except Faculty.DoesNotExist:
            print(f"  Faculty ID {item['faculty_id']} not found for Major: {item['name']}")
    
    return count


def load_default_roles():
    """Load default roles"""
    default_roles = ['Student', 'Tutor', 'Admin']
    
    count = 0
    for role_name in default_roles:
        role, created = Role.objects.get_or_create(name=role_name)
        if created:
            count += 1
            print(f"  Created Role: {role.name}")
        else:
            print(f"  Role exists: {role.name}")
    
    return count


def main():
    print("=" * 50)
    print("Loading Fixture Data into Database")
    print("=" * 50)
    
    try:
        # Load Roles first
        print("\nLoading Roles...")
        roles_count = load_default_roles()
        
        # Load Faculties
        print("\nLoading Faculties...")
        faculties_count = load_faculties()
        
        # Load Majors (depends on Faculties)
        print("\nLoading Majors...")
        majors_count = load_majors()
        
        # Summary
        print("\n" + "=" * 50)
        print("Loading Complete!")
        print(f"   - Roles created: {roles_count}")
        print(f"   - Faculties created: {faculties_count}")
        print(f"   - Majors created: {majors_count}")
        print("=" * 50)
    except Exception as e:
        print(f"ERROR loading fixtures: {e}")
        import traceback
        traceback.print_exc()
        # Don't exit with error - let the server start anyway
        print("Continuing despite fixture error...")


if __name__ == '__main__':
    main()
