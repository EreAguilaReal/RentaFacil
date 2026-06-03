from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='usuario',
            name='tipo_documento',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
