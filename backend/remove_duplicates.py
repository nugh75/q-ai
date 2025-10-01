from app.database import SessionLocal
from app.models import StudentResponse, TeacherResponse
from sqlalchemy import func

def remove_duplicates():
    db = SessionLocal()
    
    try:
        # Trova tutti i code duplicati per studenti
        student_dupes = db.query(
            StudentResponse.code
        ).group_by(
            StudentResponse.code
        ).having(
            func.count(StudentResponse.code) > 1
        ).all()
        
        print(f"Trovati {len(student_dupes)} studenti con duplicati")
        
        deleted_students = 0
        for (code,) in student_dupes:
            # Trova tutti i record con questo code
            records = db.query(StudentResponse).filter(
                StudentResponse.code == code
            ).order_by(StudentResponse.id).all()
            
            # Mantieni il primo, elimina gli altri
            for record in records[1:]:
                db.delete(record)
                deleted_students += 1
        
        # Trova tutti i code duplicati per insegnanti
        teacher_dupes = db.query(
            TeacherResponse.code
        ).group_by(
            TeacherResponse.code
        ).having(
            func.count(TeacherResponse.code) > 1
        ).all()
        
        print(f"Trovati {len(teacher_dupes)} insegnanti con duplicati")
        
        deleted_teachers = 0
        for (code,) in teacher_dupes:
            # Trova tutti i record con questo code
            records = db.query(TeacherResponse).filter(
                TeacherResponse.code == code
            ).order_by(TeacherResponse.id).all()
            
            # Mantieni il primo, elimina gli altri
            for record in records[1:]:
                db.delete(record)
                deleted_teachers += 1
        
        # Commit delle modifiche
        db.commit()
        
        print(f"\n✅ Eliminati {deleted_students} record studenti duplicati")
        print(f"✅ Eliminati {deleted_teachers} record insegnanti duplicati")
        
        # Verifica conteggi finali
        final_students = db.query(StudentResponse).count()
        final_teachers = db.query(TeacherResponse).count()
        
        print(f"\n📊 Conteggi finali:")
        print(f"   Studenti: {final_students}")
        print(f"   Insegnanti: {final_teachers}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Errore: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    remove_duplicates()
