"""Add narrative_report field to qualitative_taxonomies

Revision ID: add_narrative_report
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Add narrative_report column to qualitative_taxonomies
    op.add_column('qualitative_taxonomies', 
        sa.Column('narrative_report', sa.Text(), nullable=True)
    )

def downgrade():
    # Remove narrative_report column
    op.drop_column('qualitative_taxonomies', 'narrative_report')
