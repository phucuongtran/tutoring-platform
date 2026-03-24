from rest_framework import serializers
from .models import Feedback

class FeedbackSerializer(serializers.ModelSerializer):
    from_user_name = serializers.SerializerMethodField()
    from_user_username = serializers.SerializerMethodField()

    class Meta:
        model = Feedback
        fields = ["id", "session", "from_user", "from_user_name", "from_user_username", "rating", "comment", "created_at"]
        read_only_fields = ["from_user", "created_at", "from_user_name", "from_user_username"]

    def validate_rating(self, value):
        """
        rating là optional, nhưng nếu có thì phải nằm trong khoảng 1–5.
        """
        if value is None:
            return value
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating phải nằm trong khoảng 1 đến 5.")
        return value

    def get_from_user_name(self, obj):
        full = obj.from_user.get_full_name().strip()
        return full or obj.from_user.username

    def get_from_user_username(self, obj):
        return obj.from_user.username