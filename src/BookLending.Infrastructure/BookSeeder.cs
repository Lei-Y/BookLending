using BookLending.Domain;

namespace BookLending.Infrastructure;

public static class BookSeeder
{
    public static void Seed(IBookRepository repo)
    {
        var seed = new (string Title, string Owner, bool Available)[]
        {
            ("The Pragmatic Programmer", "Alice", true),
            ("Clean Code", "Bob", false),
            ("Domain-Driven Design", "Carol", true),
            ("Refactoring", "Dan", true),
            ("Designing Data-Intensive Applications", "Eve", false),
            ("Code Complete", "Frank", true),
            ("The Mythical Man-Month", "Grace", true),
            ("Working Effectively with Legacy Code", "Heidi", false),
            ("You Don't Know JS", "Ivan", true),
            ("Eloquent JavaScript", "Judy", true),
            ("CLR via C#", "Kevin", false),
            ("C# in Depth", "Laura", true),
            ("Patterns of Enterprise Application Architecture", "Mike", true),
        };
        foreach (var (title, owner, available) in seed)
        {
            repo.Add(new Book { Title = title, Owner = owner, Available = available });
        }
    }
}
